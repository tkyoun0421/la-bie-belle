[CmdletBinding()]
param(
  [string]$Owner = "tkyoun0421",
  [string]$Repo = "la-bie-belle",
  [string]$SeedPath = "scripts/github/project-roadmap.seed.json",
  [string]$TokenEnvVar = "GITHUB_TOKEN",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

function Get-Json {
  param(
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Seed file not found: $Path"
  }

  return Get-Content -LiteralPath $Path -Encoding UTF8 -Raw | ConvertFrom-Json
}

function Get-Headers {
  param(
    [string]$Token
  )

  return @{
    Authorization = "Bearer $Token"
    Accept = "application/vnd.github+json"
    "User-Agent" = "la-bie-belle-roadmap-bootstrap"
    "X-GitHub-Api-Version" = "2022-11-28"
  }
}

function Get-DotEnvValue {
  param(
    [string]$Path,
    [string]$Name
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  $escapedName = [regex]::Escape($Name)
  foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }

    if ($line -match "^\s*#") {
      continue
    }

    if ($line -match "^\s*$escapedName\s*=\s*(.*)\s*$") {
      $value = $matches[1].Trim()

      if (
        ($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))
      ) {
        $value = $value.Substring(1, $value.Length - 2)
      }

      if ([string]::IsNullOrWhiteSpace($value)) {
        return $null
      }

      return $value
    }
  }

  return $null
}

function Get-TokenValue {
  param(
    [string]$Name
  )

  $value = [Environment]::GetEnvironmentVariable($Name)
  if (-not [string]::IsNullOrWhiteSpace($value)) {
    return $value
  }

  $envLocalPath = Join-Path $RepoRoot ".env.local"
  $value = Get-DotEnvValue -Path $envLocalPath -Name $Name
  if (-not [string]::IsNullOrWhiteSpace($value)) {
    [Environment]::SetEnvironmentVariable($Name, $value, "Process")
    return $value
  }

  return $null
}

function Invoke-GitHubRest {
  param(
    [string]$Method,
    [string]$Uri,
    [hashtable]$Headers,
    $Body
  )

  $params = @{
    Method = $Method
    Uri = $Uri
    Headers = $Headers
  }

  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 100
    $params.ContentType = "application/json; charset=utf-8"
    $params.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
  }

  return Invoke-RestMethod @params
}

function Invoke-GitHubGraphQL {
  param(
    [hashtable]$Headers,
    [string]$Query,
    [hashtable]$Variables
  )

  $json = @{
      query = $Query
      variables = $Variables
    } | ConvertTo-Json -Depth 100

  $response = Invoke-RestMethod -Method Post -Uri "https://api.github.com/graphql" -Headers $Headers -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($json))

  if ($response.errors) {
    $messages = $response.errors | ForEach-Object { $_.message }
    throw "GraphQL request failed: $($messages -join '; ')"
  }

  return $response.data
}

function Ensure-Label {
  param(
    [string]$Owner,
    [string]$Repo,
    [pscustomobject]$Label,
    [hashtable]$Headers,
    [hashtable]$ExistingLabels,
    [switch]$DryRun
  )

  if ($ExistingLabels.ContainsKey($Label.name)) {
    Write-Host "label exists: $($Label.name)"
    return
  }

  if ($DryRun) {
    Write-Host "dry-run create label: $($Label.name)"
    return
  }

  Invoke-GitHubRest -Method Post -Uri "https://api.github.com/repos/$Owner/$Repo/labels" -Headers $Headers -Body @{
    name = $Label.name
    color = $Label.color
    description = $Label.description
  } | Out-Null

  Write-Host "created label: $($Label.name)"
}

function Ensure-Milestone {
  param(
    [string]$Owner,
    [string]$Repo,
    [pscustomobject]$Milestone,
    [hashtable]$Headers,
    [hashtable]$ExistingMilestones,
    [switch]$DryRun
  )

  if ($ExistingMilestones.ContainsKey($Milestone.title)) {
    Write-Host "milestone exists: $($Milestone.title)"
    return $ExistingMilestones[$Milestone.title]
  }

  if ($DryRun) {
    Write-Host "dry-run create milestone: $($Milestone.title)"
    return [pscustomobject]@{
      number = -1
      title = $Milestone.title
      html_url = "dry-run://milestone/$($Milestone.title)"
    }
  }

  $created = Invoke-GitHubRest -Method Post -Uri "https://api.github.com/repos/$Owner/$Repo/milestones" -Headers $Headers -Body @{
    title = $Milestone.title
    description = $Milestone.description
    state = "open"
  }

  Write-Host "created milestone: $($Milestone.title)"
  return $created
}

function Ensure-Issue {
  param(
    [string]$Owner,
    [string]$Repo,
    [pscustomobject]$Issue,
    $Milestone,
    [hashtable]$Headers,
    [hashtable]$ExistingIssues,
    [switch]$DryRun
  )

  if ($ExistingIssues.ContainsKey($Issue.title)) {
    Write-Host "issue exists: $($Issue.title)"
    return $ExistingIssues[$Issue.title]
  }

  if ($DryRun) {
    Write-Host "dry-run create issue: $($Issue.title)"
    return [pscustomobject]@{
      title = $Issue.title
      html_url = "dry-run://issue/$($Issue.title)"
      node_id = "dry-run-node"
    }
  }

  $created = Invoke-GitHubRest -Method Post -Uri "https://api.github.com/repos/$Owner/$Repo/issues" -Headers $Headers -Body @{
    title = $Issue.title
    body = $Issue.body
    labels = @($Issue.labels)
    milestone = $Milestone.number
  }

  Write-Host "created issue: $($Issue.title)"
  return $created
}

function Ensure-RepositoryVariable {
  param(
    [string]$Owner,
    [string]$Repo,
    [string]$Name,
    [string]$Value,
    [hashtable]$Headers,
    [switch]$DryRun
  )

  if ($DryRun) {
    Write-Host "dry-run set repo variable: $Name=$Value"
    return
  }

  try {
    Invoke-GitHubRest -Method Patch -Uri "https://api.github.com/repos/$Owner/$Repo/actions/variables/$Name" -Headers $Headers -Body @{
      name = $Name
      value = $Value
    } | Out-Null

    Write-Host "updated repo variable: $Name"
  }
  catch {
    Invoke-GitHubRest -Method Post -Uri "https://api.github.com/repos/$Owner/$Repo/actions/variables" -Headers $Headers -Body @{
      name = $Name
      value = $Value
    } | Out-Null

    Write-Host "created repo variable: $Name"
  }
}

function Get-OrCreate-Project {
  param(
    [string]$ProjectTitle,
    [hashtable]$Headers,
    [switch]$DryRun
  )

  if ($DryRun) {
    Write-Host "dry-run ensure project: $ProjectTitle"
    return [pscustomobject]@{
      id = "dry-run-project"
      title = $ProjectTitle
      url = "dry-run://project/$ProjectTitle"
      number = -1
    }
  }

  $viewer = Invoke-GitHubGraphQL -Headers $Headers -Query @'
query {
  viewer {
    id
    login
    projectsV2(first: 50) {
      nodes {
        id
        title
        url
        number
      }
    }
  }
}
'@ -Variables @{}

  $existingProject = $viewer.viewer.projectsV2.nodes | Where-Object { $_.title -eq $ProjectTitle } | Select-Object -First 1
  if ($existingProject) {
    Write-Host "project exists: $ProjectTitle"
    return $existingProject
  }

  $createdProject = Invoke-GitHubGraphQL -Headers $Headers -Query @'
mutation($ownerId: ID!, $title: String!) {
  createProjectV2(input: { ownerId: $ownerId, title: $title }) {
    projectV2 {
      id
      title
      url
      number
    }
  }
}
'@ -Variables @{
    ownerId = $viewer.viewer.id
    title = $ProjectTitle
  }

  Write-Host "created project: $ProjectTitle"
  return $createdProject.createProjectV2.projectV2
}

function Add-Issue-ToProject {
  param(
    [string]$ProjectId,
    [string]$IssueNodeId,
    [hashtable]$Headers,
    [switch]$DryRun
  )

  if ($DryRun) {
    Write-Host "dry-run add issue to project: $IssueNodeId"
    return
  }

  try {
    Invoke-GitHubGraphQL -Headers $Headers -Query @'
mutation($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
    item {
      id
    }
  }
}
'@ -Variables @{
      projectId = $ProjectId
      contentId = $IssueNodeId
    } | Out-Null

    Write-Host "added issue to project"
  }
  catch {
    Write-Host "skip add to project: $($_.Exception.Message)"
  }
}

$seed = Get-Json -Path $SeedPath

Write-Output "repo: $Owner/$Repo"
Write-Output "seed: $SeedPath"
Write-Output "project: $($seed.projectTitle)"
Write-Output "dry-run: $DryRun"

if ($DryRun) {
  foreach ($milestone in $seed.milestones) {
    Write-Output "milestone: $($milestone.title)"
    foreach ($issue in $milestone.issues) {
      Write-Output "  issue: $($issue.title)"
    }
  }
  return
}

$token = Get-TokenValue -Name $TokenEnvVar
if ([string]::IsNullOrWhiteSpace($token)) {
  throw "Missing token. Set $TokenEnvVar in the current environment or add it to .env.local in the repo root."
}

$headers = Get-Headers -Token $token

$project = Get-OrCreate-Project -ProjectTitle $seed.projectTitle -Headers $headers
Ensure-RepositoryVariable -Owner $Owner -Repo $Repo -Name $seed.repositoryProjectVariable -Value $project.url -Headers $headers

$labelResponse = Invoke-GitHubRest -Method Get -Uri "https://api.github.com/repos/$Owner/$Repo/labels?per_page=100" -Headers $headers -Body $null
$existingLabels = @{}
foreach ($label in $labelResponse) {
  $existingLabels[$label.name] = $label
}
foreach ($label in $seed.labels) {
  Ensure-Label -Owner $Owner -Repo $Repo -Label $label -Headers $headers -ExistingLabels $existingLabels
}

$milestoneResponse = Invoke-GitHubRest -Method Get -Uri "https://api.github.com/repos/$Owner/$Repo/milestones?state=all&per_page=100" -Headers $headers -Body $null
$existingMilestones = @{}
foreach ($milestone in $milestoneResponse) {
  $existingMilestones[$milestone.title] = $milestone
}

$issueResponse = Invoke-GitHubRest -Method Get -Uri "https://api.github.com/repos/$Owner/$Repo/issues?state=all&per_page=100" -Headers $headers -Body $null
$existingIssues = @{}
foreach ($issue in $issueResponse) {
  if (-not $issue.pull_request) {
    $existingIssues[$issue.title] = $issue
  }
}

foreach ($milestoneSeed in $seed.milestones) {
  $milestone = Ensure-Milestone -Owner $Owner -Repo $Repo -Milestone $milestoneSeed -Headers $headers -ExistingMilestones $existingMilestones
  $existingMilestones[$milestoneSeed.title] = $milestone

  foreach ($issueSeed in $milestoneSeed.issues) {
    $issue = Ensure-Issue -Owner $Owner -Repo $Repo -Issue $issueSeed -Milestone $milestone -Headers $headers -ExistingIssues $existingIssues
    $existingIssues[$issueSeed.title] = $issue
    Add-Issue-ToProject -ProjectId $project.id -IssueNodeId $issue.node_id -Headers $headers
  }
}

Write-Output ""
Write-Output "project url: $($project.url)"
Write-Output "done"
