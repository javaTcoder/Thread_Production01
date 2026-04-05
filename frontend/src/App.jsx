import { Box, Container, useBreakpointValue, useColorModeValue } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import UserPage from "./pages/UserPage";
import PostPage from "./pages/PostPage";
import Header from "./components/Header";
import LeftSidebar from "./components/LeftSidebar";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import VerifyPage from "./pages/VerifyPage";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import UpdateProfilePage from "./pages/UpdateProfilePage";
import CreatePost from "./components/CreatePost";
import ChatPage from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import FollowingPage from "./pages/FollowingPage";
import AdminPage from "./pages/AdminPage";
import ReelsPage from "./pages/ReelsPage";

function App() {
	const user = useRecoilValue(userAtom);
	const { pathname } = useLocation();
	const isMobile = useBreakpointValue({ base: true, md: false });
	return pathname === "/reels" && isMobile ? (
		/* full-screen reels without header/sidebar on mobile */
		<Box w='full' h='100vh'>
			<ReelsPage />
		</Box>
	) : (
		<Box position={"relative"} w='full'>
			<LeftSidebar />
			<Container ml={{ base: 0, md: "280px" }} maxW={pathname === "/" ? { base: "620px", md: "900px" } : "620px"} bg={useColorModeValue("gray.50", "gray.900")}>
				<Header />
				<CreatePost />
				<Routes>
					<Route path='/' element={user ? <HomePage /> : <Navigate to='/auth' />} />
					<Route path='/auth' element={!user ? <AuthPage /> : <Navigate to='/' />} />
					<Route path='/verify/:token' element={<VerifyPage />} />
					<Route path='/update' element={user ? <UpdateProfilePage /> : <Navigate to='/auth' />} />

					<Route
						path='/:username'
						element={user ? <UserPage /> : <UserPage />}
					/>
					<Route path='/:username/post/:pid' element={<PostPage />} />
					<Route path='/chat' element={user ? <ChatPage /> : <Navigate to={'/auth'} />} />
					<Route path='/settings' element={user ? <SettingsPage /> : <Navigate to={'/auth'} />} />
					<Route path='/following' element={user ? <FollowingPage /> : <Navigate to={'/auth'} />} />
					<Route path='/admin' element={user && user.isAdmin ? <AdminPage /> : <Navigate to={'/'} />} />
					<Route path='/reels' element={<ReelsPage />} />
				</Routes>
			</Container>
		</Box>
	);
}

export default App;
