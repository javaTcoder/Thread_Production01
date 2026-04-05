import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    IconButton,
} from "@chakra-ui/react";
import { FiMoreHorizontal, FiSave, FiLink } from "react-icons/fi";
import { BsThreeDots, BsFlag, BsPersonX, BsPersonCheck, BsFillHeartFill } from "react-icons/bs";
import { MdOutlineReport } from "react-icons/md";
import { FaRegTimesCircle } from "react-icons/fa";
import useShowToast from "../hooks/useShowToast";

const PostOptions = ({ post, author, onDelete }) => {
    const showToast = useShowToast();

    const placeholder = (msg) => () => showToast("Info", msg + " (not implemented)", "info");

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/${author?.username}/post/${post._id}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast("Success", "Copied link to clipboard", "success");
        } catch (err) {
            showToast("Error", "Failed to copy link", "error");
        }
    };

    const handleBlock = async () => {
        if (!window.confirm("Are you sure you want to block this user?")) return;
        showToast("Success", `Blocked ${author?.username}`, "success");
    };

    const handleReport = async () => {
        if (!window.confirm("Report this post?")) return;
        showToast("Success", "Reported post", "success");
    };

    return (
        <Menu onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<BsThreeDots />}
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            />
            <MenuList onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <MenuItem icon={<FiSave />} onClick={placeholder("Save")}>
                    Save
                </MenuItem>
                <MenuItem icon={<FaRegTimesCircle />} onClick={placeholder("Not interested")}>
                    Not interested
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<BsPersonX />} onClick={placeholder("Mute user")}>
                    Mute
                </MenuItem>
                <MenuItem icon={<BsPersonCheck />} onClick={placeholder("Restrict user")}>
                    Restrict
                </MenuItem>
                <MenuItem color="red.500" icon={<BsThreeDots />} onClick={handleBlock}>
                    Block
                </MenuItem>
                <MenuItem color="red.500" icon={<MdOutlineReport />} onClick={handleReport}>
                    Report
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FiLink />} onClick={handleCopyLink}>
                    Copy link
                </MenuItem>
                <MenuItem icon={<FiMoreHorizontal />} onClick={placeholder("Add to feed")}>
                    Add to feed
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<BsFillHeartFill />} onClick={placeholder("Like or Save")}>Save</MenuItem>
                {onDelete && (
                    <>
                        <MenuDivider />
                        <MenuItem icon={<BsThreeDots />} onClick={onDelete}>
                            Delete
                        </MenuItem>
                    </>
                )}
            </MenuList>
        </Menu>
    );
};

export default PostOptions;
