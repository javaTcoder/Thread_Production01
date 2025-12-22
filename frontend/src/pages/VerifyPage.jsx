import { Box, Heading, Text, Spinner, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

export default function VerifyPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();
    const navigate = useNavigate();

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await fetch(`/api/users/verify/${token}`);
                const data = await res.json();
                if (data.error) {
                    showToast("Error", data.error, "error");
                    setLoading(false);
                    return;
                }

                if (data.user) {
                    // set user and redirect
                    localStorage.setItem("user-threads", JSON.stringify(data.user));
                    setUser(data.user);
                    showToast("Success", data.message || "Email verified", "success");
                    navigate("/");
                } else {
                    showToast("Success", data.message || "Email verified", "success");
                    navigate("/auth");
                }
            } catch (err) {
                showToast("Error", err.message, "error");
            } finally {
                setLoading(false);
            }
        };

        if (token) verify();
    }, [token]);

    return (
        <Box py={20} textAlign="center">
            {loading ? (
                <>
                    <Spinner size="xl" />
                    <Text mt={4}>Verifying your email...</Text>
                </>
            ) : (
                <>
                    <Heading size="md">Verification</Heading>
                    <Text mt={4}>If you are not redirected automatically, go to the login page.</Text>
                    <Button mt={4} onClick={() => navigate("/auth")}>Go to login</Button>
                </>
            )}
        </Box>
    );
}
