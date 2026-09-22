// Metro는 서체·이미지 파일을 모듈로 다루지만 expo/types는 .ttf 선언을 안 준다.
declare module "*.ttf" {
  const asset: number;
  export default asset;
}
