import { Box, Heading, Stat, StatLabel, StatNumber, SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, Button, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/stats`);
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to load stats", status: "error", duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const resolve = async (id) => {
        try {
            await fetch(`/api/admin/reports/${id}/resolve`, { method: "PATCH" });
            toast({ title: "Report resolved", status: "success", duration: 2000 });
            fetchStats();
        } catch (err) {
            console.error(err);
            toast({ title: "Failed", status: "error", duration: 2000 });
        }
    };

    if (loading) return <Box>Loading...</Box>;

    return (
        <Box>
            <Heading size="md" mb={4}>Admin Panel</Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Stat>
                    <StatLabel>Registered Users</StatLabel>
                    <StatNumber>{stats?.totalUsers ?? 0}</StatNumber>
                </Stat>
                <Stat>
                    <StatLabel>Online Users</StatLabel>
                    <StatNumber>{stats?.onlineUsersCount ?? 0}</StatNumber>
                </Stat>
                <Stat>
                    <StatLabel>Active (7d)</StatLabel>
                    <StatNumber>{stats?.activeUsersCount ?? 0}</StatNumber>
                </Stat>
            </SimpleGrid>

            <Heading size="sm" mb={3}>Suspicious Reports</Heading>
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Reporter</Th>
                        <Th>Reported</Th>
                        <Th>Reason</Th>
                        <Th>Date</Th>
                        <Th>Resolved</Th>
                        <Th>Action</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {stats?.reports?.map((r) => (
                        <Tr key={r._id}>
                            <Td>{r.reporter?.username || "-"}</Td>
                            <Td>{r.reportedUser?.username || "-"}</Td>
                            <Td>{r.reason || "-"}</Td>
                            <Td>{new Date(r.createdAt).toLocaleString()}</Td>
                            <Td>{r.resolved ? "Yes" : "No"}</Td>
                            <Td>
                                {!r.resolved && (
                                    <Button size="sm" onClick={() => resolve(r._id)}>Resolve</Button>
                                )}
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
}
