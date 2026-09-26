import dumbUi from "./dumb-ui.mjs";
import noArbitraryClassValues from "./no-arbitrary-class-values.mjs";
import noColorLiterals from "./no-color-literals.mjs";
import noCrossSliceImport from "./no-cross-slice-import.mjs";
import noDefaultPaletteClass from "./no-default-palette-class.mjs";
import noVisualUtilityClass from "./no-visual-utility-class.mjs";

const house = {
  meta: { name: "eslint-plugin-house" },
  rules: {
    "dumb-ui": dumbUi,
    "no-arbitrary-class-values": noArbitraryClassValues,
    "no-color-literals": noColorLiterals,
    "no-cross-slice-import": noCrossSliceImport,
    "no-default-palette-class": noDefaultPaletteClass,
    "no-visual-utility-class": noVisualUtilityClass,
  },
};

export default house;
