import { Avatar, Divider, Flex, Text, Menu, MenuButton, MenuList, MenuItem, MenuDivider, IconButton } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { BsThreeDots } from "react-icons/bs";
import { MdOutlineReport } from "react-icons/md";

const Comment = ({ reply, lastReply, onDeleteComment, isCommentOwner }) => {
	const placeholder = (msg) => () => console.log(msg + " (not implemented)");

	return (
		<>
			<Flex gap={4} py={2} my={2} w={"full"}>
				<Avatar src={reply.userProfilePic} size={"sm"} />
				<Flex gap={1} w={"full"} flexDirection={"column"}>
					<Flex w={"full"} justifyContent={"space-between"} alignItems={"center"}>
						<Flex alignItems={"center"} gap={2}>
							<Text fontSize='sm' fontWeight='bold'>
								{reply.username}
							</Text>
							{reply.createdAt && (
								<Text fontSize='xs' color='gray.light'>
									{formatDistanceToNow(new Date(reply.createdAt))} ago
								</Text>
							)}
						</Flex>
						<Menu onClick={(e) => e.stopPropagation()}>
							<MenuButton
								as={IconButton}
								aria-label="Options"
								icon={<BsThreeDots />}
								variant="ghost"
								size="sm"
								onClick={(e) => e.stopPropagation()}
							/>
							<MenuList onClick={(e) => e.stopPropagation()}>
								<MenuItem icon={<MdOutlineReport />} color="red.500">
									Report
								</MenuItem>
								{isCommentOwner && (
									<>
										<MenuDivider />
										<MenuItem color="red.500" onClick={onDeleteComment}>
											Delete
										</MenuItem>
									</>
								)}
							</MenuList>
						</Menu>
					</Flex>
					<Text>{reply.text}</Text>
				</Flex>
			</Flex>
			{!lastReply ? <Divider /> : null}
		</>
	);
};

export default Comment;
