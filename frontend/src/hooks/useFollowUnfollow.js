import { useState, useEffect } from "react";
import useShowToast from "./useShowToast";
import userAtom from "../atoms/userAtom";
import { useRecoilValue } from "recoil";

const useFollowUnfollow = (user) => {
	const currentUser = useRecoilValue(userAtom);
	const safeFollowers = Array.isArray(user?.followers) ? user.followers : [];
	const [following, setFollowing] = useState(Boolean(currentUser && safeFollowers.includes(currentUser._id)));
	const [updating, setUpdating] = useState(false);
	const showToast = useShowToast();

	// update following state when user or currentUser changes
	useEffect(() => {
		const followers = Array.isArray(user?.followers) ? user.followers : [];
		setFollowing(Boolean(currentUser && followers.includes(currentUser._id)));
	}, [user, currentUser]);

	const handleFollowUnfollow = async () => {
		if (!currentUser) {
			showToast("Error", "Please login to follow", "error");
			return;
		}
		if (updating) return;

		setUpdating(true);
		try {
			const res = await fetch(`/api/users/follow/${user._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			if (following) {
				showToast("Success", `Unfollowed ${user.name}`, "success");
				if (Array.isArray(user.followers)) {
					user.followers = user.followers.filter((id) => id !== currentUser?._id);
				}
			} else {
				showToast("Success", `Followed ${user.name}`, "success");
				if (!Array.isArray(user.followers)) {
					user.followers = [];
				}
				user.followers = [...user.followers, currentUser?._id];
			}

			// toggle local state after success
			setFollowing(!following);
			console.log(data);
		} catch (error) {
			showToast("Error", error, "error");
		} finally {
			setUpdating(false);
		}
	};

	return { handleFollowUnfollow, updating, following };
};

export default useFollowUnfollow;
