export type SubmitProfileInput = {
  displayName: string;
  phone: string;
  birthDate: string;
  gender: string;
};

export type UploadAvatarInput = {
  userId: string;
  uri: string;
  contentType: string;
  extension: string;
};
