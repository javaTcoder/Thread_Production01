import { Box, IconButton, VStack, Text, Avatar, Flex, Spinner, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { FaHeart, FaRegComment, FaRegShareSquare, FaBookmark, FaEllipsisH, FaVolumeMute, FaVolumeUp, FaPlay, FaPause } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";

export default function ReelsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef();
  const videosRef = useRef({});
  const [showPlayPause, setShowPlayPause] = useState(false);
  const playPauseTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const showToast = useShowToast();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/posts/feed', { credentials: 'include' });
        const data = await res.json();
        // filter for videos
        const videos = (data || []).filter(p => p.mediaType === 'video' || (p.img && p.img.startsWith && p.img.startsWith('data:video')));
        setPosts(videos);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videos = container.querySelectorAll('video');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.play().catch(() => {});
        } else {
          try { video.pause(); } catch(e) {}
        }
      });
    }, { threshold: [0.6] });

    videos.forEach(v => observer.observe(v));

    return () => observer.disconnect();
  }, [posts]);

  const toggleLike = async (postId, idx) => {
    try {
      await fetch(`/api/posts/like/${postId}`, { method: 'PUT', credentials: 'include' });
      // update UI
      setPosts(prev => prev.map((p,i) => i===idx ? { ...p, likes: p.likes && p.likes.length ? (p.likes.includes('me') ? p.likes.filter(x=>x!=='me') : [...p.likes,'me']) : ['me'] } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const videos = containerRef.current?.querySelectorAll('video');
    if (videos) {
      videos.forEach(video => {
        video.muted = !isMuted;
      });
    }
  };

  const togglePlayPause = (e) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    setShowPlayPause(true);
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
    }
    playPauseTimeoutRef.current = setTimeout(() => {
      setShowPlayPause(false);
    }, 2000);
  };

  const handleShare = async (post) => {
    const url = `${window.location.origin}/${post.postedBy?.username}/post/${post._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this reel',
          text: post.text || 'Amazing reel!',
          url: url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        showToast('Success', 'Link copied to clipboard', 'success');
      } catch (err) {
        showToast('Error', 'Failed to copy link', 'error');
      }
    }
  };

  const toggleBookmark = async (postId) => {
    try {
      await fetch(`/api/posts/bookmark/${postId}`, { method: 'PUT', credentials: 'include' });
      showToast('Success', 'Post bookmarked', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to bookmark', 'error');
    }
  };

  const handleReport = (post) => {
    // For now, just show toast. In real app, open report modal or navigate.
    showToast('Info', 'Report feature coming soon', 'info');
  };

  const goToPost = (post) => {
    navigate(`/${post.postedBy?.username}/post/${post._id}`);
  };

  const shareTo = (post) => {
    // For now, same as share
    handleShare(post);
  };

  const copyLink = async (post) => {
    const url = `${window.location.origin}/${post.postedBy?.username}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Success', 'Link copied to clipboard', 'success');
    } catch (err) {
      showToast('Error', 'Failed to copy link', 'error');
    }
  };

  const embed = (post) => {
    const embedCode = `<iframe src="${window.location.origin}/${post.postedBy?.username}/post/${post._id}" width="400" height="600"></iframe>`;
    try {
      navigator.clipboard.writeText(embedCode);
      showToast('Success', 'Embed code copied to clipboard', 'success');
    } catch (err) {
      showToast('Error', 'Failed to copy embed code', 'error');
    }
  };

  const aboutAccount = (post) => {
    navigate(`/${post.postedBy?.username}`);
  };

  if (loading) return <Flex h="100vh" align="center" justify="center"><Spinner /></Flex>;

  if (!posts.length) return <Flex h="100vh" align="center" justify="center"><Text>No reels available</Text></Flex>;

  return (
    <Box
      h="100vh"
      w="100%"
      bg="black"
      overflowY="auto"
      ref={containerRef}
      sx={{
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {posts.map((p, idx) => (
        <Box
          key={p._id}
          h="100vh"
          w="100%"
          position="relative"
          scrollSnapAlign="start"
        >

          {/* VIDEO */}
          <video
            ref={(el) => (videosRef.current[p._id] = el)}
            src={p.img}
            muted={isMuted}
            loop
            playsInline
            onClick={togglePlayPause}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "black",
            }}
          />

          {/* PLAY/PAUSE BUTTON */}
          {showPlayPause && (
            <IconButton
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              icon={videosRef.current[p._id]?.paused ? <FaPlay size={48} /> : <FaPause size={48} />}
              variant="ghost"
              color="white"
              bg="rgba(0,0,0,0.5)"
              borderRadius="full"
              size="lg"
              _hover={{ bg: "rgba(0,0,0,0.7)" }}
              pointerEvents="none"
            />
          )}

          {/* GRADIENT OVERLAY */}
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            height="40%"
            bgGradient="linear(to-t, rgba(0,0,0,0.9), transparent)"
          />

          {/* USER INFO + CAPTION */}
          <Flex
            position="absolute"
            bottom="20"
            left="4"
            direction="column"
            color="white"
            maxW="70%"
          >
            <Flex align="center" mb={2}>
              <Avatar
                size="sm"
                src={p.postedBy?.profilePic}
                name={p.postedBy?.username}
                mr={2}
              />
              <Text fontWeight="bold">@{p.postedBy?.username}</Text>
            </Flex>

            <Text fontSize="sm">
              {p.text || "Amazing reel 🔥"}
            </Text>
          </Flex>

          {/* ACTION BUTTONS */}
          <VStack
            position="absolute"
            right="4"
            bottom="20"
            spacing={5}
            color="white"
          >
            <Flex direction="column" align="center">
              <IconButton
                icon={<FaHeart size={26} />}
                variant="ghost"
                onClick={() => toggleLike(p._id, idx)}
              />
              <Text fontSize="xs">{p.likes?.length || 0}</Text>
            </Flex>

            <Flex direction="column" align="center">
              <IconButton
                icon={<FaRegComment size={26} />}
                variant="ghost"
                onClick={() => navigate(`/${p.postedBy?.username}/post/${p._id}`)}
              />
              <Text fontSize="xs">{p.replies?.length || 0}</Text>
            </Flex>

            <IconButton
              icon={<FaRegShareSquare size={24} />}
              variant="ghost"
              onClick={() => handleShare(p)}
            />

            <IconButton
              icon={<FaBookmark size={24} />}
              variant="ghost"
              onClick={() => toggleBookmark(p._id)}
            />

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaEllipsisH size={20} />}
                variant="ghost"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
              />
              <MenuList bg="gray.800" color="white" borderColor="gray.600">
                <MenuItem onClick={() => handleReport(p)} bg="transparent" _hover={{ bg: "gray.700" }}>
                  Report
                </MenuItem>
                <MenuItem onClick={() => goToPost(p)} bg="transparent" _hover={{ bg: "gray.700" }}>
                  Go to post
                </MenuItem>
                <MenuItem onClick={() => shareTo(p)} bg="transparent" _hover={{ bg: "gray.700" }}>
                  Share to...
                </MenuItem>
                <MenuItem onClick={() => copyLink(p)} bg="transparent" _hover={{ bg: "gray.700" }}>
                  Copy link
                </MenuItem>
                <MenuItem onClick={() => embed(p)} bg="transparent" _hover={{ bg: "gray.700" }}>
                  Embed
                </MenuItem>
                <MenuItem onClick={() => aboutAccount(p)} bg="transparent" _hover={{ bg: "gray.700" }}>
                  About this account
                </MenuItem>
              </MenuList>
            </Menu>
          </VStack>

          {/* MUTE BUTTON */}
          <IconButton
            position="absolute"
            top="4"
            right="4"
            icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            onClick={toggleMute}
            bg="rgba(0,0,0,0.4)"
            color="white"
            _hover={{ bg: "rgba(0,0,0,0.6)" }}
            borderRadius="full"
          />

        </Box>
      ))}
    </Box>
  );
}
