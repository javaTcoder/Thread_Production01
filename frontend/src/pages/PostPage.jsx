import { Avatar, Box, Button, Divider, Flex, Image, Spinner, Text } from "@chakra-ui/react";
import Actions from "../components/Actions";
import { useEffect, useState, useRef } from "react";
import Comment from "../components/Comment";
import useShowToast from "../hooks/useShowToast";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { DeleteIcon } from "@chakra-ui/icons";
import PostOptions from "../components/PostOptions";
import postsAtom from "../atoms/postsAtom";

const PostPage = () => {
	const [author, setAuthor] = useState(null);
	const [authorLoading, setAuthorLoading] = useState(true);
	const [posts, setPosts] = useRecoilState(postsAtom);
	const showToast = useShowToast();
	const { pid } = useParams();
	const currentUser = useRecoilValue(userAtom);
	const navigate = useNavigate();
	const videoRef = useRef(null);
	const [videoElement, setVideoElement] = useState(null);

	const currentPost = posts[0];

	useEffect(() => {
		const getPost = async () => {
			setPosts([]);
			try {
				const res = await fetch(`/api/posts/${pid}`);
				const data = await res.json();
				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}
				setPosts([data]);

				// fetch the post author's profile
				try {
					const authorRes = await fetch(`/api/users/profile/${data.postedBy}`);
					const authorData = await authorRes.json();
					if (!authorData.error) setAuthor(authorData);
				} catch (err) {
					console.error("Failed to fetch author profile:", err);
				} finally {
					setAuthorLoading(false);
				}
			} catch (error) {
				showToast("Error", error.message, "error");
			}
		};
		getPost();
	}, [showToast, pid, setPosts]);

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
							}
						}
					});
				},
				{
					threshold: [0, 0.3],
					rootMargin: '50px',
				}
			);

			observer.observe(video);
		};

		setupObserver();

		const handleVisibilityChange = () => {
			if (document.hidden && !video.paused) {
				video.pause();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (observer) {
				observer.disconnect();
			}
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [videoElement, currentPost?._id]); // Re-run when the current video changes

	const handleDeletePost = async () => {
		try {
			if (!window.confirm("Are you sure you want to delete this post?")) return;

			const res = await fetch(`/api/posts/${currentPost._id}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Post deleted", "success");
			navigate(`/${author?.username}`);
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	const handleDeleteComment = async (replyId) => {
		try {
			if (!window.confirm("Are you sure you want to delete this comment?")) return;

			const res = await fetch(`/api/posts/${currentPost._id}/reply/${replyId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Comment deleted", "success");
			
			// Update posts state to remove the deleted reply
			const updatedPosts = posts.map((post) => {
				if (post._id === currentPost._id) {
					return {
						...post,
						replies: post.replies.filter((reply) => reply._id !== replyId),
					};
				}
				return post;
			});
			setPosts(updatedPosts);
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	if (!author && authorLoading) {
		return (
			<Flex justifyContent={"center"}>
				<Spinner size={"xl"} />
			</Flex>
		);
	}

	if (!currentPost) return null;
	console.log("currentPost", currentPost);

	return (
		<>
			<Flex>
				<Flex w={"full"} alignItems={"center"} gap={3}>
					<Avatar src={author?.profilePic} size={"md"} name={author?.name || author?.username} />
					<Flex>
						<Text fontSize={"sm"} fontWeight={"bold"}>
						{author?.username}
						</Text>
						<Image src='/verified.png' w='4' h={4} ml={4} />
					</Flex>
				</Flex>
				<Flex gap={4} alignItems={"center"}>
					<Text fontSize={"xs"} width={36} textAlign={"right"} color={"gray.light"}>
						{formatDistanceToNow(new Date(currentPost.createdAt))} ago
					</Text>

					{currentUser?._id === author?._id ? (
						<PostOptions post={currentPost} author={author} onDelete={handleDeletePost} />
					) : (
						<PostOptions post={currentPost} author={author} />
					)}
				</Flex>
			</Flex>

			<Text my={3}>{currentPost.text}</Text>

			{currentPost.img && (
						<Box borderRadius={6} overflow={"hidden"} border={"1px solid"} borderColor={"gray.light"}>
							{currentPost.mediaType === 'video' || (currentPost.img && /\.(mp4|mov|webm)$/i.test(currentPost.img)) ? (
								<video 
									ref={(el) => {
										videoRef.current = el;
										setVideoElement(el);
									}}
									src={currentPost.img} 
									controls 
									playsInline
									autoPlay
									style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', borderRadius: 6 }}
									muted // Start muted to allow autoplay
								/>
							) : (
								<Image src={currentPost.img} w={"full"} />
							)}
						</Box>
					)}

			<Flex gap={3} my={3}>
				<Actions post={currentPost} />
			</Flex>

			<Divider my={4} />

			<Flex justifyContent={"space-between"}>
				<Flex gap={2} alignItems={"center"}>
					<Text fontSize={"2xl"}>👋</Text>
					<Text color={"gray.light"}>Get the app to like, reply and post.</Text>
				</Flex>
				<Button>Get</Button>
			</Flex>

			<Divider my={4} />
			{currentPost.replies.map((reply) => (
				<Comment
					key={reply._id}
					reply={reply}
					lastReply={reply._id === currentPost.replies[currentPost.replies.length - 1]._id}
					isCommentOwner={currentUser?._id === reply.userId}
					onDeleteComment={() => handleDeleteComment(reply._id)}
				/>
			))}
		</>
	);
};

export default PostPage;
