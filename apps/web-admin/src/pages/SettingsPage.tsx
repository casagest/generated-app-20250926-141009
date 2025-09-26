import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getUsersAndRoles, getEscrowRules, getContracts, getAgencies, getSettlements } from "@/lib/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { EscrowRuleForm } from "@/components/EscrowRuleForm";
import { ContractForm } from "@/components/ContractForm";
import { DataImportCard } from "@/components/DataImportCard";
import { format } from "date-fns";
import { Agency, AgencyContract } from "@shared/types";
export function SettingsPage() {
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<AgencyContract | null>(null);
  const usersQuery = useQuery({ queryKey: ["usersAndRoles"], queryFn: getUsersAndRoles });
  const escrowQuery = useQuery({ queryKey: ["escrowRules"], queryFn: getEscrowRules });
  const contractsQuery = useQuery({ queryKey: ["contracts"], queryFn: getContracts });
  const agenciesQuery = useQuery<Agency[]>({ queryKey: ["agencies"], queryFn: getAgencies });
  const settlementsQuery = useQuery({ queryKey: ["settlements"], queryFn: getSettlements });
  const handleEditContract = (contract: AgencyContract) => {
    setSelectedContract(contract);
    setIsContractFormOpen(true);
  };
  const handleAddNewContract = () => {
    setSelectedContract(null);
    setIsContractFormOpen(true);
  };
  return (
    <>
      <ContractForm
        isOpen={isContractFormOpen}
        onClose={() => setIsContractFormOpen(false)}
        contract={selectedContract}
        agencies={agenciesQuery.data || []}
      />
      <div className="space-y-8 animate-fade-in">
        <h1 className="text-4xl font-bold font-display">Settings</h1>
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="escrow">Escrow</TabsTrigger>
            <TabsTrigger value="clinic">Clinic Details</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="import">Data Import</TabsTrigger>
          </TabsList>
          <TabsContent value="import" className="mt-6">
            <DataImportCard />
          </TabsContent>
          <TabsContent value="contracts" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Agency Contract Management</CardTitle>
                    <CardDescription>Manage financial agreements with marketing agencies.</CardDescription>
                  </div>
                  <Button onClick={handleAddNewContract}><PlusCircle className="mr-2 h-4 w-4" /> Add Contract</Button>
                </div>
              </CardHeader>
              <CardContent>
                {contractsQuery.isLoading ? <TableSkeleton columnCount={4} /> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Contract Name</TableHead><TableHead>Agency</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {contractsQuery.data?.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">{contract.name}</TableCell>
                          <TableCell>{agenciesQuery.data?.find(a => a.id === contract.agency_id)?.name || 'N/A'}</TableCell>
                          <TableCell><Badge variant={contract.status === "Active" ? "default" : "outline"}>{contract.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleEditContract(contract)}>Manage</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Settlement History</CardTitle>
                    <CardDescription>View historical payout records based on contract performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    {settlementsQuery.isLoading ? <TableSkeleton columnCount={5} /> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Agency</TableHead><TableHead>Contract</TableHead><TableHead className="text-right">Total Payout</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {settlementsQuery.data?.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>{format(new Date(s.period_start), 'MMM yyyy')}</TableCell>
                                        <TableCell>{s.agency_name}</TableCell>
                                        <TableCell>{s.contract_name}</TableCell>
                                        <TableCell className="text-right font-medium">${s.total_payout.toLocaleString()}</TableCell>
                                        <TableCell><Badge variant={s.status === 'Paid' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage your team members and their roles.</CardDescription>
                  </div>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersQuery.isLoading ? <TableSkeleton columnCount={5} /> : usersQuery.isError ? <div className="text-red-500">Error: {usersQuery.error.message}</div> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {usersQuery.data?.users.map((user) => (
                        <TableRow key={user.id}><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell><Badge variant="outline">{user.role}</Badge></TableCell><TableCell><Badge variant={user.status === "Active" ? "default" : "destructive"}>{user.status}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuItem>Deactivate</DropdownMenuItem><DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="escrow" className="mt-6 space-y-6">
            <EscrowRuleForm />
            <Card>
              <CardHeader><CardTitle>Escrow Rule History</CardTitle><CardDescription>View all past and present escrow rules.</CardDescription></CardHeader>
              <CardContent>
                {escrowQuery.isLoading ? <TableSkeleton columnCount={5} /> : escrowQuery.isError ? <div className="text-red-500">Error: {escrowQuery.error.message}</div> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Clinic Share</TableHead><TableHead>Agency Share</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {escrowQuery.data?.map((rule) => (
                        <TableRow key={rule.id}><TableCell><Badge variant={rule.is_active ? "default" : "outline"}>{rule.is_active ? "Active" : "Inactive"}</Badge></TableCell><TableCell>{rule.clinic_share_percentage}%</TableCell><TableCell>{rule.agency_share_percentage}%</TableCell><TableCell>{format(new Date(rule.start_date), 'yyyy-MM-dd')}</TableCell><TableCell>{rule.end_date ? format(new Date(rule.end_date), 'yyyy-MM-dd') : 'Ongoing'}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}