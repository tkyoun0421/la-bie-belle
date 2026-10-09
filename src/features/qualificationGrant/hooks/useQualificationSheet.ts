import { QUALIFICATION_GRANT_COPY } from "@/features/qualificationGrant/consts/qualificationGrant.const";
import type {
  QualificationSheetController,
  QualificationSheetInput,
} from "@/features/qualificationGrant/model/qualificationSheet.type";

export function useQualificationSheet({
  name,
  position,
}: QualificationSheetInput): QualificationSheetController {
  return {
    title: `${name}${QUALIFICATION_GRANT_COPY.titlePrefix}${position}${QUALIFICATION_GRANT_COPY.titleSuffix}`,
    grantDetail: `${QUALIFICATION_GRANT_COPY.grantDetailPrefix}${position}${QUALIFICATION_GRANT_COPY.grantDetailSuffix}`,
  };
}
