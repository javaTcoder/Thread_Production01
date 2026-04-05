import {
	Button,
	Text,
	Switch,
	FormControl,
	FormLabel,
	VStack,
	HStack,
	Icon,
	Box,
} from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// icons used in the settings list
import { AiOutlineUser, AiOutlineBell, AiOutlineLock, AiOutlineStar, AiOutlineMail, AiOutlineHeart, AiOutlineInfoCircle, AiOutlineCheckCircle, AiOutlineShareAlt } from "react-icons/ai";
import { MdBlock, MdOutlineLocationOn, MdLanguage, MdWeb, MdVolumeOff, MdDoNotDisturbAlt, MdOutlineVisibilityOff, MdSupervisedUserCircle, MdWorkOutline } from "react-icons/md";
import { BsDownload, BsFillHandbagFill, BsShieldLock, BsQuestionCircle } from "react-icons/bs";
import { FaRegComment, FaRegClock, FaUniversalAccess, FaRegSmile, FaAt } from "react-icons/fa";
import { BiMoney } from "react-icons/bi";

export const SettingsPage = () => {
	const showToast = useShowToast();
	const logout = useLogout();
	const navigate = useNavigate();

	// account actions (freeze / privacy) remain available for convenience
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

	// Privacy toggle state
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

	// generic placeholder used for options that haven't been implemented yet
	const placeholder = (feature) => () => showToast("Info", `${feature} is not available yet`, "info");

	// sections and items based on the screenshot the user provided
	const sections = [
		...(user?.isAdmin ? [{
			title: "Admin Panel",
			items: [
				{ label: "Admin", icon: AiOutlineUser, onClick: () => navigate("/admin") },
				
			],
		}] : []),
		{
			title: "How you use Instagram",
			items: [
				{ label: "Edit Profile", icon: AiOutlineUser, onClick: () => navigate("/update") },
				{ label: "Notifications", icon: AiOutlineBell, onClick: placeholder("Notifications") },
			],
		},
		{
			title: "Who can see your content",
			items: [
				{
					label: "Account privacy",
					icon: AiOutlineLock,
					type: "toggle",
					checked: isPrivate,
					onChange: togglePrivacy,
				},
				{ label: "Close Friends", icon: AiOutlineStar, onClick: placeholder("Close Friends") },
				{ label: "Blocked", icon: MdBlock, onClick: placeholder("Blocked") },
				{
					label: "Story and location",
					icon: MdOutlineLocationOn,
					onClick: placeholder("Story and location"),
				},
			],
		},
		{
			title: "How others can interact with you",
			items: [
				{
					label: "Messages and story replies",
					icon: AiOutlineMail,
					onClick: placeholder("Messages and story replies"),
				},
				{ label: "Tags and mentions", icon: FaAt, onClick: placeholder("Tags and mentions") },
				{ label: "Comments", icon: FaRegComment, onClick: placeholder("Comments") },
				{ label: "Sharing", icon: AiOutlineShareAlt, onClick: placeholder("Sharing") },
				{ label: "Restricted accounts", icon: MdDoNotDisturbAlt, onClick: placeholder("Restricted accounts") },
				{ label: "Hidden words", icon: MdOutlineVisibilityOff, onClick: placeholder("Hidden words") },
			],
		},
		{
			title: "What you see",
			items: [
				{ label: "Muted accounts", icon: MdVolumeOff, onClick: placeholder("Muted accounts") },
				{ label: "Content preferences", icon: FaRegClock, onClick: placeholder("Content preferences") },
				{ label: "Like and share counts", icon: AiOutlineHeart, onClick: placeholder("Like and share counts") },
				{ label: "Subscriptions", icon: BiMoney, onClick: placeholder("Subscriptions") },
			],
		},
		{
			title: "Your app and media",
			items: [
				{ label: "Archiving and downloading", icon: BsDownload, onClick: placeholder("Archiving and downloading") },
				{ label: "Accessibility", icon: FaUniversalAccess, onClick: placeholder("Accessibility") },
				{ label: "Language", icon: MdLanguage, onClick: placeholder("Language") },
				{ label: "Website permissions", icon: MdWeb, onClick: placeholder("Website permissions") },
			],
		},
		{
			title: "Family Centre",
			items: [
				{
					label: "Supervision for Teen Accounts",
					icon: MdSupervisedUserCircle,
					onClick: placeholder("Supervision for Teen Accounts"),
				},
			],
		},
		{
			title: "For professionals",
			items: [
				{
					label: "Account type and tools",
					icon: MdWorkOutline,
					onClick: placeholder("Account type and tools"),
				},
				{
					label: "Meta Verified",
					icon: AiOutlineCheckCircle,
					onClick: placeholder("Meta Verified"),
				},
			],
		},
		{
			title: "More info and support",
			items: [
				{ label: "Help", icon: BsQuestionCircle, onClick: placeholder("Help") },
				{ label: "Privacy Centre", icon: BsShieldLock, onClick: placeholder("Privacy Centre") },
				{
					label: "Account Status",
					icon: AiOutlineInfoCircle,
					onClick: placeholder("Account Status"),
				},
			],
		},
	];

	return (
		<Box px={4} py={2}>
			{sections.map((sec) => (
				<Box key={sec.title} mb={6}>
					<Text fontWeight="bold" mb={2} fontSize="lg">
						{sec.title}
					</Text>
					<VStack align="start" spacing={2}>
						{sec.items.map((item) => (
							<HStack
								key={item.label}
								w="100%"
								justify="space-between"
								px={2}
								py={1}
								borderRadius="md"
								_hover={{ bg: "gray.100" }}
								cursor={item.onClick || item.type === "toggle" ? "pointer" : "default"}
								onClick={item.onClick}
							>
								<HStack spacing={2}>
									{item.icon && <Icon as={item.icon} />}
									<Text>{item.label}</Text>
								</HStack>
								{item.type === "toggle" && (
									<Switch
										isChecked={item.checked}
										onChange={item.onChange}
									/>
								)}
							</HStack>
						))}
					</VStack>
				</Box>
			))}

			{/* freeze account section left at bottom */}
			<Box mt={4} borderTop="1px" borderColor="gray.200" pt={4}>
				<Text my={1} fontWeight={"bold"}>
					Freeze Your Account
				</Text>
				<Text my={1}>You can unfreeze your account anytime by logging in.</Text>
				<Button size={"sm"} colorScheme="red" onClick={freezeAccount}>
					Freeze
				</Button>
			</Box>
		</Box>
	);
};
