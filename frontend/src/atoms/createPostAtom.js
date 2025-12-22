import { atom } from "recoil";

const createPostAtom = atom({
  key: "createPostAtom",
  default: false,
});

export default createPostAtom;
