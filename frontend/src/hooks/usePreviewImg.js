import { useState } from "react";
import useShowToast from "./useShowToast";

const usePreviewImg = () => {
	const [imgUrl, setImgUrl] = useState(null);
	const [file, setFile] = useState(null);
	const showToast = useShowToast();
	const handleImageChange = (e) => {
		const fileSelected = e.target.files[0];
		if (fileSelected && fileSelected.type.startsWith("image/")) {
			const reader = new FileReader();

			reader.onloadend = () => {
				setImgUrl(reader.result);
				setFile(fileSelected);
			};

			reader.readAsDataURL(fileSelected);
		} else {
			showToast("Invalid file type", " Please select an image file", "error");
			setImgUrl(null);
			setFile(null);
		}
	};
	return { handleImageChange, imgUrl, setImgUrl, file, setFile };
};

export default usePreviewImg;
