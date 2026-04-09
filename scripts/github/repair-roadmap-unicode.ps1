[CmdletBinding()]
param(
  [string]$Owner = "tkyoun0421",
  [string]$Repo = "la-bie-belle",
  [string]$SeedPath = "scripts/github/project-roadmap.seed.json",
  [string]$TokenEnvVar = "GITHUB_TOKEN"
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
    "User-Agent" = "la-bie-belle-roadmap-repair"
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

$seed = Get-Json -Path $SeedPath
$token = Get-TokenValue -Name $TokenEnvVar

if ([string]::IsNullOrWhiteSpace($token)) {
  throw "Missing token. Set $TokenEnvVar in the current environment or add it to .env.local in the repo root."
}

$headers = Get-Headers -Token $token

$existingLabels = @{}
$labelResponse = Invoke-GitHubRest -Method Get -Uri "https://api.github.com/repos/$Owner/$Repo/labels?per_page=100" -Headers $headers -Body $null
foreach ($label in $labelResponse) {
  $existingLabels[$label.name] = $label
}

foreach ($labelSeed in $seed.labels) {
  $encodedLabelName = [System.Uri]::EscapeDataString($labelSeed.name)

  if ($existingLabels.ContainsKey($labelSeed.name)) {
    Invoke-GitHubRest -Method Patch -Uri "https://api.github.com/repos/$Owner/$Repo/labels/$encodedLabelName" -Headers $headers -Body @{
      new_name = $labelSeed.name
      color = $labelSeed.color
      description = $labelSeed.description
    } | Out-Null

    Write-Host "updated label: $($labelSeed.name)"
    continue
  }

  Invoke-GitHubRest -Method Post -Uri "https://api.github.com/repos/$Owner/$Repo/labels" -Headers $headers -Body @{
    name = $labelSeed.name
    color = $labelSeed.color
    description = $labelSeed.description
  } | Out-Null

  Write-Host "created label: $($labelSeed.name)"
}

$desiredLabelNames = @{}
foreach ($labelSeed in $seed.labels) {
  $desiredLabelNames[$labelSeed.name] = $true
}

foreach ($existingLabelName in $existingLabels.Keys) {
  if ($desiredLabelNames.ContainsKey($existingLabelName)) {
    continue
  }

  if (-not $existingLabelName.StartsWith("phase:")) {
    continue
  }

  $encodedLabelName = [System.Uri]::EscapeDataString($existingLabelName)
  Invoke-GitHubRest -Method Delete -Uri "https://api.github.com/repos/$Owner/$Repo/labels/$encodedLabelName" -Headers $headers -Body $null | Out-Null
  Write-Host "deleted obsolete label: $existingLabelName"
}

$remoteMilestones = @(Invoke-GitHubRest -Method Get -Uri "https://api.github.com/repos/$Owner/$Repo/milestones?state=all&per_page=100" -Headers $headers -Body $null)
$remoteMilestones = @($remoteMilestones | ForEach-Object { $_ } | Sort-Object number)
$milestoneNumberByTitle = @{}
$assignedMilestoneNumbers = @{}

for ($i = 0; $i -lt $seed.milestones.Count; $i++) {
  $milestoneSeed = $seed.milestones[$i]
  $matchingMilestone = $remoteMilestones | Where-Object { $_.title -eq $milestoneSeed.title } | Select-Object -First 1

  if ($null -ne $matchingMilestone) {
    Invoke-GitHubRest -Method Patch -Uri "https://api.github.com/repos/$Owner/$Repo/milestones/$($matchingMilestone.number)" -Headers $headers -Body @{
      title = $milestoneSeed.title
      description = $milestoneSeed.description
      state = "open"
    } | Out-Null

    $milestoneNumberByTitle[$milestoneSeed.title] = $matchingMilestone.number
    $assignedMilestoneNumbers[$matchingMilestone.number] = $true
    Write-Host "updated milestone #$($matchingMilestone.number): $($milestoneSeed.title)"
    continue
  }

  $fallbackMilestone = $remoteMilestones | Where-Object { -not $assignedMilestoneNumbers.ContainsKey($_.number) } | Select-Object -First 1

  if ($null -ne $fallbackMilestone) {
    Invoke-GitHubRest -Method Patch -Uri "https://api.github.com/repos/$Owner/$Repo/milestones/$($fallbackMilestone.number)" -Headers $headers -Body @{
      title = $milestoneSeed.title
      description = $milestoneSeed.description
      state = "open"
    } | Out-Null

    $milestoneNumberByTitle[$milestoneSeed.title] = $fallbackMilestone.number
    $assignedMilestoneNumbers[$fallbackMilestone.number] = $true
    Write-Host "retitled milestone #$($fallbackMilestone.number): $($milestoneSeed.title)"
    continue
  }

  $createdMilestone = Invoke-GitHubRest -Method Post -Uri "https://api.github.com/repos/$Owner/$Repo/milestones" -Headers $headers -Body @{
      title = $milestoneSeed.title
      description = $milestoneSeed.description
      state = "open"
    }

  $milestoneNumberByTitle[$milestoneSeed.title] = $createdMilestone.number
  $assignedMilestoneNumbers[$createdMilestone.number] = $true
  Write-Host "created milestone #$($createdMilestone.number): $($milestoneSeed.title)"
}

foreach ($remoteMilestone in $remoteMilestones) {
  if ($assignedMilestoneNumbers.ContainsKey($remoteMilestone.number)) {
    continue
  }

  Invoke-GitHubRest -Method Patch -Uri "https://api.github.com/repos/$Owner/$Repo/milestones/$($remoteMilestone.number)" -Headers $headers -Body @{
    title = $remoteMilestone.title
    description = $remoteMilestone.description
    state = "closed"
  } | Out-Null

  Write-Host "closed extra milestone #$($remoteMilestone.number): $($remoteMilestone.title)"
}

$flattenedIssueSeeds = @()
foreach ($milestoneSeed in $seed.milestones) {
  foreach ($issueSeed in $milestoneSeed.issues) {
    $flattenedIssueSeeds += [pscustomobject]@{
      milestoneTitle = $milestoneSeed.title
      issue = $issueSeed
    }
  }
}

$remoteIssues = @(Invoke-GitHubRest -Method Get -Uri "https://api.github.com/repos/$Owner/$Repo/issues?state=all&per_page=100" -Headers $headers -Body $null)
$remoteIssues = @($remoteIssues | ForEach-Object { $_ } | Where-Object { -not $_.pull_request } | Sort-Object number)

for ($i = 0; $i -lt $flattenedIssueSeeds.Count; $i++) {
  $issueSeedEntry = $flattenedIssueSeeds[$i]
  $issueSeed = $issueSeedEntry.issue
  $milestoneNumber = $milestoneNumberByTitle[$issueSeedEntry.milestoneTitle]

  if ($i -lt $remoteIssues.Count) {
    $remoteIssue = $remoteIssues[$i]
    Invoke-GitHubRest -Method Patch -Uri "https://api.github.com/repos/$Owner/$Repo/issues/$($remoteIssue.number)" -Headers $headers -Body @{
      title = $issueSeed.title
      body = $issueSeed.body
      labels = @($issueSeed.labels)
      milestone = $milestoneNumber
      state = "open"
    } | Out-Null

    Write-Host "updated issue #$($remoteIssue.number): $($issueSeed.title)"
    continue
  }

  $createdIssue = Invoke-GitHubRest -Method Post -Uri "https://api.github.com/repos/$Owner/$Repo/issues" -Headers $headers -Body @{
    title = $issueSeed.title
    body = $issueSeed.body
    labels = @($issueSeed.labels)
    milestone = $milestoneNumber
  }

  Write-Host "created issue #$($createdIssue.number): $($issueSeed.title)"
}

Write-Host ""
Write-Host "repair complete"
