import { Button, Text, Switch, FormControl, FormLabel } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { useState, useEffect } from "react";

export const SettingsPage = () => {
	const showToast = useShowToast();
	const logout = useLogout();

	const freezeAccount = async () => {
		if (!window.confirm("Are you sure you want to freeze your account?")) return;

		try {
			const res = await fetch("/api/users/freeze", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();

			if (data.error) {
				return showToast("Error", data.error, "error");
			}
			if (data.success) {
				await logout();
				showToast("Success", "Your account has been frozen", "success");
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	// Privacy toggle
	const [user, setUser] = useRecoilState(userAtom);
	const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);

	useEffect(() => {
		setIsPrivate(user?.isPrivate || false);
	}, [user]);

	const togglePrivacy = async () => {
		const newVal = !isPrivate;
		try {
			const res = await fetch("/api/users/privacy", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isPrivate: newVal }),
			});
			const data = await res.json();
			if (data.error) return showToast("Error", data.error, "error");
			if (data.user) {
				setUser(data.user);
				localStorage.setItem("user-threads", JSON.stringify(data.user));
			}
			setIsPrivate(newVal);
			showToast("Success", "Privacy updated", "success");
		} catch (err) {
			showToast("Error", err.message, "error");
		}
	};

	return (
		<>
			<Text my={1} fontWeight={"bold"}>
				Freeze Your Account
			</Text>
			<Text my={1}>You can unfreeze your account anytime by logging in.</Text>
			<Button size={"sm"} colorScheme='red' onClick={freezeAccount}>
				Freeze
			</Button>

			<FormControl display="flex" alignItems="center" mt={4}>
				<FormLabel htmlFor="private-switch" mb="0">
					Make account private
				</FormLabel>
				<Switch id="private-switch" isChecked={isPrivate} onChange={togglePrivacy} />
			</FormControl>
		</>
	);
};
