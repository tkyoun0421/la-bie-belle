export type PersonSheetInput = {
  name: string;
  photoUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  qualifications: readonly string[];
};

export type PersonSheetGenderIcon = "Venus" | "Mars";

export type PersonSheetController = {
  name: string;
  photoUrl: string | null;
  genderIcon: PersonSheetGenderIcon | null;
  factsLine: string | null;
  qualificationLine: string | null;
};
