import { Button, Flex, Image, Link, useColorMode, HStack, Text,Avatar, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, MenuDivider, IconButton } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { Link as RouterLink } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";
import createPostAtom from "../atoms/createPostAtom";
import { BsThreeDots } from "react-icons/bs";

const Header = () => {
	const { colorMode, toggleColorMode } = useColorMode();
	const user = useRecoilValue(userAtom);
	const logout = useLogout();
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const setCreateOpen = useSetRecoilState(createPostAtom);

	return (
		<Flex justifyContent={"space-between"} mt={6} mb='12'>
			{!user && (
				<Link as={RouterLink} to={"/auth"} onClick={() => setAuthScreen("login")}>
					Login
				</Link>
			)}

			<Image
				cursor={"pointer"}
				alt='logo'
				w={6}
				src={colorMode === "dark" ? "/light-logo.svg" : "/dark-logo.svg"}
				onClick={toggleColorMode}
			/>

			{user && (
				<Flex alignItems={"center"} gap={4}>
					{/* Desktop navigation */}
					<HStack spacing={4} display={{ base: "none", md: "flex" }}>
						<Link as={RouterLink} to='/'>
							<AiFillHome size={24} />
						</Link>
						<Button as={RouterLink} to='/' variant='ghost' size='sm'>For you</Button>
						<Button as={RouterLink} to='/following' variant='ghost' size='sm'>Following</Button>
						<Button variant='ghost' size='sm' onClick={() => setCreateOpen(true)}>Ghost post</Button>
					</HStack>

					{/* Mobile three-dots menu */}
					<Menu>
						<MenuButton
							as={IconButton}
							aria-label="Menu"
							icon={<BsThreeDots />}
							variant="ghost"
							display={{ base: "flex", md: "none" }}
						/>
						<MenuList>
							<MenuItem as={RouterLink} to='/' icon={<AiFillHome />}>
								Home
							</MenuItem>
							<MenuItem as={RouterLink} to='/following'>
								Following
							</MenuItem>
							<MenuItem onClick={() => setCreateOpen(true)}>
								Create Post
							</MenuItem>
							<MenuDivider />
							<MenuItem as={RouterLink} to={`/${user?.username}`}>
								Profile
							</MenuItem>
							<MenuItem as={RouterLink} to={`/chat`} icon={<BsFillChatQuoteFill />}>
								Messages
							</MenuItem>
							<MenuItem as={RouterLink} to={`/settings`} icon={<MdOutlineSettings />}>
								Settings
							</MenuItem>
							<MenuDivider />
							<MenuItem onClick={logout} color="red.500">
								Logout
							</MenuItem>
						</MenuList>
					</Menu>

					{/* Desktop user actions */}
					<Flex alignItems={"center"} gap={4} display={{ base: "none", md: "flex" }}>
						<Link as={RouterLink} to={`/${user?.username}`}>
                            <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                <Avatar name={user?.name} src={user?.profilePic} size="sm" />
                                 
                            </Flex>
                        </Link>
						<Link as={RouterLink} to={`/chat`}>
							<BsFillChatQuoteFill size={20} />
						</Link>
						<Link as={RouterLink} to={`/settings`}>
							<MdOutlineSettings size={20} />
						</Link>
						<Button size={"xs"} onClick={logout}>
							<FiLogOut size={20} />
						</Button>
					</Flex>
				</Flex>
			)}

			{!user && (
				<Link as={RouterLink} to={"/auth"} onClick={() => setAuthScreen("signup")}>
					Sign up
				</Link>
			)}
		</Flex>
	);
};

export default Header;
