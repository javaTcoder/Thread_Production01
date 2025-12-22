import { AddIcon } from "@chakra-ui/icons";
import {
	Button,
	CloseButton,
	Flex,
	FormControl,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	Textarea,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import createPostAtom from "../atoms/createPostAtom";
import usePreviewImg from "../hooks/usePreviewImg";
import { BsFillImageFill } from "react-icons/bs";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { useParams } from "react-router-dom";

const MAX_CHAR = 500;

const CreatePost = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [createOpen, setCreateOpen] = useRecoilState(createPostAtom);

	// open modal when atom is set
	useEffect(() => {
		if (createOpen) onOpen();
	}, [createOpen]);

	// Close modal when route changes (prevents overlay hiding navigated pages like /following)
	const location = useLocation();
	useEffect(() => {
		if (createOpen) {
			onClose();
			setCreateOpen(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname]);
	const [postText, setPostText] = useState("");
	const { handleImageChange, imgUrl, setImgUrl, file, setFile } = usePreviewImg();
	const [mediaType, setMediaType] = useState(null); // 'image' | 'video' | null
	const videoRef = useRef(null);
	const [videoFileName, setVideoFileName] = useState("");
	const imageRef = useRef(null);
	const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const [loading, setLoading] = useState(false);
	const [posts, setPosts] = useRecoilState(postsAtom);
	const { username } = useParams();

	const handleTextChange = (e) => {
		const inputText = e.target.value;

		if (inputText.length > MAX_CHAR) {
			const truncatedText = inputText.slice(0, MAX_CHAR);
			setPostText(truncatedText);
			setRemainingChar(0);
		} else {
			setPostText(inputText);
			setRemainingChar(MAX_CHAR - inputText.length);
		}
	};

	const handleCreatePost = async () => {
		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("postedBy", user._id);
			formData.append("text", postText);
			if (mediaType) formData.append("mediaType", mediaType);
			if (file) formData.append("img", file);

			const res = await fetch("/api/posts/create", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Post created successfully", "success");
			if (username === user.username) {
				setPosts([data, ...posts]);
			}
			onClose();
			setPostText("");
			setImgUrl("");
			setFile(null);
			setMediaType(null);
		} catch (error) {
			showToast("Error", error, "error");
		} finally {
			setLoading(false);
		}
	};

	// Handle video selection and validation
	const handleVideoChange = (e) => {
		const videoFile = e.target.files[0];
		if (!videoFile) return;

		const maxSize = 100 * 1024 * 1024; // 100 MB in bytes
		const allowedTypes = ["video/mp4", "video/quicktime"]; // mp4, mov

		if (!allowedTypes.includes(videoFile.type)) {
			showToast("Invalid format", "Supported formats: MP4 or MOV", "error");
			return;
		}

		if (videoFile.size > maxSize) {
			showToast("File too large", "Maximum file size is 100 MB", "error");
			return;
		}

		// Check duration by loading metadata
		const objectUrl = URL.createObjectURL(videoFile);
		const vid = document.createElement("video");
		vid.preload = "metadata";
		vid.src = objectUrl;
		vid.onloadedmetadata = () => {
			URL.revokeObjectURL(objectUrl);
			const duration = vid.duration;
			if (duration > 300) {
				showToast("Too long", "Maximum length is 5 minutes (300 seconds)", "error");
				return;
			}

			setImgUrl(URL.createObjectURL(videoFile));
			setMediaType("video");
			setVideoFileName(videoFile.name);
			setFile(videoFile);
		};
	};

	return (
		<>
			<Button
				position={"fixed"}
				bottom={10}
				right={5}
				bg={useColorModeValue("gray.300", "gray.dark")}
				onClick={() => { onOpen(); setCreateOpen(true); }}
				size={{ base: "sm", sm: "md" }}
			>
				<AddIcon />
			</Button>

			<Modal isOpen={isOpen} onClose={() => { onClose(); setCreateOpen(false); }}>
				<ModalOverlay />

				<ModalContent>
					<ModalHeader>Create Post</ModalHeader>
					<ModalCloseButton />
					<ModalBody pb={6}>
						<FormControl>
							<Textarea
								placeholder='Post content goes here..'
								onChange={handleTextChange}
								value={postText}
							/>
							<Text fontSize='xs' fontWeight='bold' textAlign={"right"} m={"1"} color={"gray.800"}>
								{remainingChar}/{MAX_CHAR}
							</Text>

							<Input type='file' hidden ref={imageRef} onChange={(e) => { handleImageChange(e); setMediaType('image'); }} accept="image/*" />

							<BsFillImageFill
								style={{ marginLeft: "5px", cursor: "pointer" }}
								size={16}
								onClick={() => imageRef.current.click()}
							/>

							{/* Video upload controls */}
							<Button variant="ghost" size="sm" ml={2} onClick={() => videoRef.current.click()}>
								Upload Video
							</Button>
							<Input type='file' hidden ref={videoRef} onChange={handleVideoChange} accept="video/mp4,video/quicktime" />

							<Text fontSize='xs' color='gray.500' mt={2}>
								Max length: 5 minutes (300s) · Max size: 100 MB · Formats: MP4, MOV · Recommended AR: 9:16
							</Text>
						</FormControl>

						{imgUrl && mediaType !== 'video' && (
							<Flex mt={5} w={"full"} position={"relative"}>
								<Image src={imgUrl} alt='Selected img' />
								<CloseButton
									onClick={() => {
									setImgUrl("");
									setMediaType(null);
								}}
									bg={"gray.800"}
									position={"absolute"}
									top={2}
									right={2}
								/>
							</Flex>
						)}

						{imgUrl && mediaType === 'video' && (
							<Flex mt={5} w={"full"} position={"relative"} flexDirection="column">
								<video src={imgUrl} controls style={{ width: '100%', height: 'auto', maxHeight: '60vh', objectFit: 'contain', borderRadius: 6 }} />
								<Text fontSize='sm' mt={2} color='gray.600'>{videoFileName}</Text>
								<CloseButton
									onClick={() => {
									setImgUrl("");
									setMediaType(null);
									setVideoFileName("");
								}}
									bg={"gray.800"}
									position={"absolute"}
									top={2}
									right={2}
								/>
							</Flex>
						)}
					</ModalBody>

					<ModalFooter>
						<Button colorScheme='blue' mr={3} onClick={handleCreatePost} isLoading={loading}>
							Post
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreatePost;
