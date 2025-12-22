import { Box, Flex, Heading, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import SuggestedUser from "../components/SuggestedUser";

const FollowingPage = () => {
	const [following, setFollowing] = useState([]);
	const [loading, setLoading] = useState(true);
	const showToast = useShowToast();

	useEffect(() => {
		const getFollowing = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/users/following");
				const data = await res.json();
				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}
				setFollowing(data);
			} catch (err) {
				showToast("Error", err.message, "error");
			} finally {
				setLoading(false);
			}
		};
		getFollowing();
	}, [showToast]);

	if (loading) {
		return (
			<Flex justifyContent={'center'}>
				<Spinner size={'xl'} />
			</Flex>
		);
	}

	return (
		<Box>
			<Heading size='md' mb={4}>Following</Heading>
			{following.length === 0 ? (
				<p>You are not following anyone yet.</p>
			) : (
				<Flex direction={'column'} gap={3}>
					{following.map((u) => (
						<SuggestedUser key={u._id} user={u} />
					))}
				</Flex>
			)}
		</Box>
	);
};

export default FollowingPage;