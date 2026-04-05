import { useEffect, useState } from "react";
import UserHeader from "../components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { Flex, Spinner } from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import Comment from "../components/Comment";

const UserPage = () => {
	const { user, loading } = useGetUserProfile();
	const { username } = useParams();
	const showToast = useShowToast();
	const [posts, setPosts] = useRecoilState(postsAtom);
	const [fetchingPosts, setFetchingPosts] = useState(true);
	const [activeTab, setActiveTab] = useState("threads");
	const [replies, setReplies] = useState([]);
	const [fetchingReplies, setFetchingReplies] = useState(false);

	useEffect(() => {
		const getPosts = async () => {
			if (!user || activeTab !== "threads") return;
			setFetchingPosts(true);
			try {
				const res = await fetch(`/api/posts/user/${username}`);
				const data = await res.json();
				console.log(data);
				setPosts(data);
			} catch (error) {
				showToast("Error", error.message, "error");
				setPosts([]);
			} finally {
				setFetchingPosts(false);
			}
		};

		getPosts();
	}, [username, showToast, setPosts, user, activeTab]);

	useEffect(() => {
		const getReplies = async () => {
			if (!user || activeTab !== "replies") return;
			setFetchingReplies(true);
			try {
				const res = await fetch(`/api/posts/user/${username}/replies`);
				const data = await res.json();
				setReplies(data);
			} catch (error) {
				showToast("Error", error.message, "error");
				setReplies([]);
			} finally {
				setFetchingReplies(false);
			}
		};

		getReplies();
	}, [username, showToast, user, activeTab]);

	if (!user && loading) {
		return (
			<Flex justifyContent={"center"}>
				<Spinner size={"xl"} />
			</Flex>
		);
	}

	if (!user && !loading) return <h1>User not found</h1>;

	return (
		<>
			<UserHeader user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

			{activeTab === "threads" && (
				<>
					{!fetchingPosts && posts.length === 0 && <h1>User has no posts.</h1>}
					{fetchingPosts && (
						<Flex justifyContent={"center"} my={12}>
							<Spinner size={"xl"} />
						</Flex>
					)}

					{posts.map((post) => (
						<Post key={post._id} post={post} postedBy={post.postedBy} />
					))}
				</>
			)}

			{activeTab === "replies" && (
				<>
					{!fetchingReplies && replies.length === 0 && <h1>User has no replies.</h1>}
					{fetchingReplies && (
						<Flex justifyContent={"center"} my={12}>
							<Spinner size={"xl"} />
						</Flex>
					)}

					{replies.map((reply, index) => (
						<Comment key={index} reply={reply} lastReply={index === replies.length - 1} />
					))}
				</>
			)}

			{activeTab === "saved" && (
				<h1>Saved posts not implemented yet.</h1>
			)}
		</>
	);
};

export default UserPage;
