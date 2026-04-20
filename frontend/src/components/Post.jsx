import { Avatar } from "@chakra-ui/avatar";
import { Image } from "@chakra-ui/image";
import { Box, Flex, Text } from "@chakra-ui/layout";
import { useNavigate } from "react-router-dom";
import Actions from "./Actions";
import { useEffect, useState, useRef } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import PostOptions from "./PostOptions";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";

const Post = ({ post, postedBy }) => {
	const [user, setUser] = useState(null);
	const showToast = useShowToast();
	const currentUser = useRecoilValue(userAtom);
	const [posts, setPosts] = useRecoilState(postsAtom);
	const navigate = useNavigate();
	const videoRef = useRef(null);
	const [videoElement, setVideoElement] = useState(null);

	useEffect(() => {
		// postedBy can be an ID string/ObjectId or a populated user object
		if (!postedBy) return;

		// if caller already passed a user object (has username property) we can skip the network request
		if (typeof postedBy === "object" && postedBy.username) {
			setUser(postedBy);
			return;
		}

		const getUser = async () => {
			try {
				const id = typeof postedBy === "object" ? postedBy._id || postedBy : postedBy;
				const res = await fetch("/api/users/profile/" + id);
				const data = await res.json();
				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}
				setUser(data);
			} catch (error) {
				showToast("Error", error.message, "error");
				setUser(null);
			}
		};

		getUser();
	}, [postedBy, showToast]);

	// Video autoplay/pause based on visibility
	useEffect(() => {
		if (!videoElement) return;

		const video = videoElement;
		let observer;

		const setupObserver = () => {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.3;

						if (isVisible) {
							if (video.paused) {
								const playPromise = video.play();
								if (playPromise !== undefined) {
									playPromise.catch(() => {
										// Autoplay blocked, user interaction required
									});
								}
							}
						} else {
							if (!video.paused) {
								video.pause();
								video.currentTime = 0;
							}
						}
					});
				},
				{
					threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
					rootMargin: '50px',
				}
			);

			observer.observe(video);
		};

		setupObserver();

		const handleVisibilityChange = () => {
			if (document.hidden && !video.paused) {
				video.pause();
				video.currentTime = 0;
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (observer) {
				observer.disconnect();
			}
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [post._id, videoElement]); // Re-run when post changes

	const handleDeletePost = async (e) => {
		try {
			e.preventDefault();
			if (!window.confirm("Are you sure you want to delete this post?")) return;

			const res = await fetch(`/api/posts/${post._id}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Post deleted", "success");
			setPosts(posts.filter((p) => p._id !== post._id));
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	if (!user) return null;
	return (
		<Flex
			gap={3}
			mb={4}
			py={5}
			cursor="pointer"
			onClick={() => navigate(`/${user.username}/post/${post._id}`)}
		>
				<Flex flexDirection={"column"} alignItems={"center"}>
					<Avatar
						size='md'
						name={user.name}
						src={user?.profilePic}
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/${user.username}`);
						}}
					/>
					<Box w='1px' h={"full"} bg='gray.light' my={2}></Box>
					<Box position={"relative"} w={"full"}>
						{post.replies.length === 0 && <Text textAlign={"center"}>🥱</Text>}
						{post.replies[0] && (
							<Avatar
								size='xs'
								name='John doe'
								src={post.replies[0].userProfilePic}
								position={"absolute"}
								top={"0px"}
								left='15px'
								padding={"2px"}
							/>
						)}

						{post.replies[1] && (
							<Avatar
								size='xs'
								name='John doe'
								src={post.replies[1].userProfilePic}
								position={"absolute"}
								bottom={"0px"}
								right='-5px'
								padding={"2px"}
							/>
						)}

						{post.replies[2] && (
							<Avatar
								size='xs'
								name='John doe'
								src={post.replies[2].userProfilePic}
								position={"absolute"}
								bottom={"0px"}
								left='4px'
								padding={"2px"}
							/>
						)}
					</Box>
				</Flex>
				<Flex flex={1} flexDirection={"column"} gap={2}>
					<Flex justifyContent={"space-between"} w={"full"}>
						<Flex w={"full"} alignItems={"center"}>
							<Text
								fontSize={"sm"}
								fontWeight={"bold"}
								onClick={(e) => {
									e.stopPropagation();
									navigate(`/${user.username}`);
								}}
							>
								{user?.username}
							</Text>
							<Image src='/verified.png' w={4} h={4} ml={1} />
						</Flex>
						<Flex gap={4} alignItems={"center"}>
							<Text fontSize={"xs"} width={36} textAlign={"right"} color={"gray.light"}>
								{formatDistanceToNow(new Date(post.createdAt))} ago
							</Text>

							{currentUser?._id === user._id ? (
								<PostOptions post={post} author={user} onDelete={handleDeletePost} />
							) : (
								<PostOptions post={post} author={user} />
							)}
						</Flex>
					</Flex>

					<Text fontSize={"sm"}>{post.text}</Text>
					{post.img && (
						<Box borderRadius={6} overflow={"hidden"} border={"1px solid"} borderColor={"gray.light"}>
							{post.mediaType === 'video' || (post.img && /\.(mp4|mov|webm)$/i.test(post.img)) ? (
								<video 
									ref={(el) => {
										videoRef.current = el;
										setVideoElement(el);
									}}
									src={post.img} 
									controls 
									playsInline
									autoPlay
									style={{ width: '100%', height: 'auto', maxHeight: '60vh', objectFit: 'contain', borderRadius: 6 }}
									onClick={(e) => e.stopPropagation()}
									muted // Start muted to allow autoplay
								/>
							) : (
								<Image src={post.img} w={"full"} onClick={(e) => e.stopPropagation()} />
							)}
						</Box>
					)}

					<Flex gap={3} my={1}>
						<Actions post={post} />
					</Flex>
				</Flex>
			</Flex>

	);
};

export default Post;
