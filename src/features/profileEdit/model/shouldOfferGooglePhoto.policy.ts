export function shouldOfferGooglePhoto(
  currentPhotoUrl: string | null,
  googlePhotoUrl: string | null,
): boolean {
  return googlePhotoUrl !== null && currentPhotoUrl !== googlePhotoUrl;
}
