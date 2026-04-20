import {
    Box,
    VStack,
    Input,
    Avatar,
    Link,
    List,
    ListItem,
    Spinner,
    Text,
    IconButton,
    Flex,
    CloseButton,
    useColorModeValue,
} from "@chakra-ui/react";
import { RxAvatar } from "react-icons/rx";
import { AiOutlineHome } from "react-icons/ai";
import { FaPlay } from "react-icons/fa";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings, MdAdminPanelSettings } from "react-icons/md";
import { FaSearch, FaShoppingBag } from "react-icons/fa";
import { AddIcon } from "@chakra-ui/icons";
import { useState, useEffect, useRef } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import createPostAtom from "../atoms/createPostAtom";

export default function LeftSidebar() {
    const user = useRecoilValue(userAtom);
    const setCreateOpen = useSetRecoilState(createPostAtom);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const timer = useRef();
    const mobileBg = useColorModeValue("gray.50", "gray.800");
    const mobileColor = useColorModeValue("gray.800", "gray.100");
    const mobileBorder = useColorModeValue("gray.200", "gray.700");
    const [hover, setHover] = useState(false);

    // Hide profile icon on auth pages
    const isAuthPage = location.pathname === "/auth";

    useEffect(() => {
        if (!query) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer.current);
    }, [query]);

    return (
        <>
            {/* Desktop left sidebar (narrow vertical bar) */}
            <Box
                position="fixed"
                left={0}
                top={0}
                height="100vh"
                width={hover ? "220px" : "72px"}
                zIndex={20}
                display={{ base: "none", md: "flex" }}
                alignItems="center"
                justifyContent="center"
                bg={useColorModeValue("gray.50", "gray.900")}
                borderRightWidth={1}
                borderRightColor={useColorModeValue("gray.100", "gray.700")}
                p={3}
                transition="width 0.12s"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <VStack spacing={6} align="center" height="100%" justifyContent="space-between">
                    <VStack spacing={6} align="stretch" mt={4} width="100%">
                        {!isAuthPage && (
                            <Link as={RouterLink} to={`/${user?.username}`}>
                                <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                    <Avatar name={user?.name} src={user?.profilePic} size="sm" />
                                    {hover && <Text ml={4} fontWeight={600}>Profile</Text>}
                                </Flex>
                            </Link>
                        )}
                        {/* <Link as={RouterLink} to={`/`} _hover={{ textDecoration: "none" }}>
                            <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                <Box w={10} h={10} borderRadius="full" display="flex" alignItems="center" justifyContent="center" bg={useColorModeValue("gray.50", "gray.800")}>
                                    <RxAvatar size={22} />
                                </Box>
                                {hover && <Text ml={4} fontWeight={600}>Home1</Text>}
                            </Flex>
                        </Link> */}

                        {/* <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                            <IconButton aria-label="Home" icon={<AiOutlineHome />} variant="ghost" size="lg" _hover={{ bg: "transparent" }} />
                            {hover && <Text ml={4} fontWeight={600}>Home2</Text>}
                        </Flex> */}

                        <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }} onClick={() => navigate('/reels')} >
                            <IconButton aria-label="Reels" icon={<FaPlay />} variant="ghost" size="lg" _hover={{ bg: "transparent" }}  />
                            {hover && <Text ml={4} fontWeight={600}>Reels</Text> }
                        </Flex>

                        <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }} onClick={() => setSearchOpen(true)}  >
                            <IconButton aria-label="Search users" icon={<FaSearch />} variant="ghost" size="lg" onClick={() => setSearchOpen(true)} _hover={{ bg: "transparent" }} />
                            {hover && <Text ml={4} fontWeight={600}>Search</Text>}
                        </Flex>

                        <Link as={RouterLink} to={`/chat`}>
                            <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                <IconButton aria-label="Chat" icon={<BsFillChatQuoteFill />} variant="ghost" size="lg" _hover={{ bg: "transparent" }} />
                                {hover && <Text ml={4} fontWeight={600}>Messages</Text>}
                            </Flex>
                        </Link>

                        {/* {user?.isAdmin && (
                            <Link as={RouterLink} to={`/admin`}>
                                <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                    <IconButton aria-label="Admin" icon={<MdAdminPanelSettings />} variant="ghost" size="lg" _hover={{ bg: "transparent" }} />
                                    {hover && <Text ml={4} fontWeight={600}>Admin</Text>}
                                </Flex>
                            </Link>
                        )} */}
                    </VStack>

                    <VStack spacing={4} mb={4} width="100%">
                        <Flex align="center" px={3} py={2} borderRadius={8} justifyContent="center">
                            <IconButton aria-label="Create post" icon={<AddIcon />} variant="outline" colorScheme="teal" size="md" onClick={() => setCreateOpen(true)} />
                            {hover && <Text ml={4} fontWeight={600}>Create</Text>}
                        </Flex>

                        <Link as={RouterLink} to={`/settings`}>
                            <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                <IconButton aria-label="Settings" icon={<MdOutlineSettings />} variant="ghost" size="lg" _hover={{ bg: "transparent" }} />
                                {hover && <Text ml={4} fontWeight={600}>Settings</Text>}
                            </Flex>
                        </Link>
                        <Link as="a" href="https://product-trust.onrender.com/" target="_blank" rel="noopener noreferrer" _hover={{ textDecoration: "none" }}>
                            <Flex align="center" px={3} py={2} borderRadius={8} _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}>
                                <IconButton aria-label="Shopping" icon={<FaShoppingBag />} variant="ghost" size="sm" _hover={{ bg: "transparent" }} ml={2} color={mobileColor} />
                                {hover && <Text ml={4} fontWeight={600}>Shopping</Text>}
                            </Flex>
                        </Link>

                        
                    </VStack>
                </VStack>
            </Box>

            {/* Mobile bottom navbar */}
            <Box
                position="fixed"
                bottom={4}
                left="50%"
                transform="translateX(-50%)"
                zIndex={20}
                display={{ base: "flex", md: "none" }}
            >
                <Flex
                    bg={mobileBg}
                    p={2}
                    borderRadius="full"
                    align="center"
                    boxShadow="md"
                    borderWidth="1px"
                    borderColor={mobileBorder}
                >
                    {user && (
                        <>
                            <Link as={RouterLink} to={`/${user.username}`} p={1} _hover={{ textDecoration: "none" }}>
                                <Avatar name={user.name} src={user.profilePic} size="sm" />
                            </Link>

                            {/* {user?.isAdmin && (
                                <Link as={RouterLink} to={`/admin`}>
                                    <IconButton aria-label="Admin" icon={<MdAdminPanelSettings />} variant="ghost" size="sm" _hover={{ bg: "transparent" }} ml={2} color={mobileColor} />
                                </Link>
                            )} */}
                        </>
                    )}

                    <IconButton
                        aria-label="Search users"
                        icon={<FaSearch />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchOpen(true)}
                        _hover={{ bg: "transparent" }}
                        ml={2}
                        color={mobileColor}
                    />

                    <Link as={RouterLink} to={`/reels`}>
                        <IconButton aria-label="Reels" icon={<FaPlay />} variant="ghost" size="sm" _hover={{ bg: "transparent" }} ml={2} color={mobileColor} />
                    </Link>

                    <IconButton
                        aria-label="Create post"
                        icon={<AddIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreateOpen(true)}
                        _hover={{ bg: "transparent" }}
                        ml={2}
                        color={mobileColor}
                    />

                    <Link as={RouterLink} to={`/chat`}>
                        <IconButton aria-label="Chat" icon={<BsFillChatQuoteFill />} variant="ghost" size="sm" _hover={{ bg: "transparent" }} ml={2} color={mobileColor} />
                    </Link>

                    <Link as={RouterLink} to={`/settings`}>
                        <IconButton aria-label="Settings" icon={<MdOutlineSettings />} variant="ghost" size="sm" _hover={{ bg: "transparent" }} ml={2} color={mobileColor} />
                    </Link>

                    <Link as="a" href="https://product-trust.onrender.com/" target="_blank" rel="noopener noreferrer" _hover={{ textDecoration: "none" }}>
                        <IconButton aria-label="Shopping" icon={<FaShoppingBag />} variant="ghost" size="sm" _hover={{ bg: "transparent" }} ml={2} color={mobileColor} />
                    </Link>
                </Flex>
            </Box>

            {searchOpen && (
                <Box position="fixed" inset={0} zIndex={50} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center">
                    <Box bg={"white"} color="gray.800" p={4} borderRadius={8} width={{ base: "90%", md: "600px" }} boxShadow="lg">
                        <Flex mb={2} alignItems="center" justifyContent="space-between">
                            <Input
                                placeholder="Search users by username or name..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                                mr={2}
                            />
                            <CloseButton onClick={() => { setSearchOpen(false); setQuery(""); }} />
                        </Flex>

                        <Box maxH="400px" overflowY="auto">
                            {loading ? (
                                <Spinner />
                            ) : results.length ? (
                                <List>
                                    {results.map((u) => (
                                        <ListItem key={u._id} cursor="pointer" onClick={() => { navigate(`/${u.username}`); setSearchOpen(false); setQuery(""); }} p={2} _hover={{ bg: "gray.50" }}>
                                            <Text fontWeight={600}>{u.username}</Text>
                                            <Text fontSize="sm">{u.name}</Text>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : query ? (
                                <Text fontSize="sm" color="gray.500">No users found</Text>
                            ) : (
                                <Text fontSize="sm" color="gray.500">Type to search users</Text>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </>
    );
}
