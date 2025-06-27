'use client';
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { 
  Plus, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings, 
  Eye,
  Edit3,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { TbRobot, TbCreditCard, TbChartLine } from "react-icons/tb";
import Link from "next/link";
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from "@/hooks/store/useAuthStore";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  subscribers: number;
  status?: 'active' | 'paused' | 'draft';
  createdAt: string;
}

interface Payment {
  id: string;
  serviceId: string;
  serviceName: string;
  subscriptionId?: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  customerWallet: string;
  txHash?: string;
  createdAt: string;
}

interface Subscriber {
  id: string;
  serviceId: string;
  serviceName: string;
  walletAddress: string;
  status: 'active' | 'cancelled' | 'expired';
  subscribedAt: string;
  nextBilling?: string;
  totalPaid: number;
}

const DashboardPage = () => {
  const { address, isConnected } = useAccount();
  const { account } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'payments' | 'subscribers'>('overview');
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [showCreateService, setShowCreateService] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  console.log(account)

  // Fetch payments by subscription ID
  const fetchPaymentsBySubscription = async (subscriptionId: string): Promise<Payment[]> => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payments/get/by-subscribtion-id/${subscriptionId}`);
      
      console.log(`Payments response for subscription ${subscriptionId}:`, response.data);
      
      if (response.data.status === "success" && response.data.data) {
        // Handle both single object and array responses
        let payments = [];
        
        if (Array.isArray(response.data.data)) {
          payments = response.data.data;
        } else if (typeof response.data.data === 'object') {
          payments = [response.data.data];
        }
        
        // Transform payments data based on actual API response structure
        return payments.map((payment: any) => ({
          id: payment._id,
          serviceId: payment.service_id || '',
          serviceName: payment.service_name || 'Unknown Service', // This will be filled later
          subscriptionId: payment.subscription_id || subscriptionId,
          amount: payment.amount || 0,
          status: payment.status || 'pending',
          customerWallet: payment.metadata?.payer || payment.customer_wallet || payment.user_id || 'Unknown',
          txHash: payment.transaction_hash || payment.tx_hash || payment.txHash,
          createdAt: payment.processed_at || payment.createdAt || payment.created_at || payment.payment_date || new Date().toISOString()
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error(`Error fetching payments for subscription ${subscriptionId}:`, error);
      
      // Check if it's a 404 (no payments found)
      if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
        console.log(`No payments found for subscription ${subscriptionId}`);
        return [];
      }
      
      return [];
    }
  };

  // Fetch all payments for all subscriptions
  const fetchAllPayments = async () => {
    if (!account?._id) return;
    
    try {
      console.log('Fetching all payments for provider:', account._id);
      
      let allPayments: Payment[] = [];
      
      // For each subscriber, fetch their payments
      for (const subscriber of subscribers) {
        try {
          const subscriptionPayments = await fetchPaymentsBySubscription(subscriber.id);
          
          // Add service name and customer info to payments from subscriber data
          const enrichedPayments = subscriptionPayments.map(payment => ({
            ...payment,
            serviceName: subscriber.serviceName, // Use subscriber's service name
            serviceId: subscriber.serviceId, // Use subscriber's service ID
            customerWallet: payment.customerWallet !== 'Unknown' ? payment.customerWallet : subscriber.walletAddress // Use subscriber's wallet if payment doesn't have customer info
          }));
          
          allPayments = [...allPayments, ...enrichedPayments];
          console.log(`Found ${subscriptionPayments.length} payments for subscriber ${subscriber.id} (${subscriber.serviceName})`);
        } catch (error) {
          console.error(`Error fetching payments for subscriber ${subscriber.id}:`, error);
        }
      }
      
      console.log(`Total payments found: ${allPayments.length}`);
      setPayments(allPayments);
    } catch (error) {
      console.error("Error fetching all payments:", error);
    }
  };

  // Fetch subscription count by service ID
  const fetchSubscriptionCount = async (serviceId: string): Promise<number> => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/get/by-service/${serviceId}`);
      
      console.log(`Subscription response for service ${serviceId}:`, response.data);
      
      // Handle different response structures
      if (response.data.status === "success") {
        if (response.data.data) {
          // Check if data is an array
          if (Array.isArray(response.data.data)) {
            return response.data.data.length;
          } 
          // If data is a single object, count it as 1
          else if (typeof response.data.data === 'object') {
            return 1;
          }
        }
        // No subscriptions found (data is null/undefined)
        return 0;
      }
      
      // If status is not success but no error thrown, return 0
      return 0;
    } catch (error: any) {
      console.error(`Error fetching subscription count for service ${serviceId}:`, error);
      
      // Check if it's a 404 or similar (no subscriptions found)
      if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
        console.log(`No subscriptions found for service ${serviceId}`);
        return 0;
      }
      
      return 0;
    }
  };

  // Fetch services by provider ID
  const fetchServicesByProvider = async () => {
    if (!account?._id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/services-k/get/by-provider-id/${account._id}`);
      
      if (response.data.status === "success" && response.data.data) {
        // Transform API data to match your interface
        const transformedServices = await Promise.all(
          response.data.data.map(async (service: any) => {
            // Fetch subscription count for each service
            const subscriptionCount = await fetchSubscriptionCount(service._id);
            
            return {
              id: service._id,
              name: service.name,
              description: service.description,
              price: service.pricing?.amount || 0,
              billingCycle: service.pricing?.billingCycle || 'monthly',
              subscribers: subscriptionCount,
              status: service.status || 'active',
              createdAt: service.createdAt
            };
          })
        );
        
        setServices(transformedServices);
      } else {
        console.log("No services found for this provider");
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all subscriptions for the provider
  const fetchAllSubscriptions = async () => {
    if (!account?._id) return;
    
    try {
      console.log('Fetching all subscriptions for provider:', account._id);
      
      // Get all services first
      const servicesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/services-k/get/by-provider-id/${account._id}`);
      
      if (servicesResponse.data.status === "success" && servicesResponse.data.data) {
        let allSubscriptions: any[] = [];
        
        // Fetch subscriptions for each service
        await Promise.all(
          servicesResponse.data.data.map(async (service: any) => {
            try {
              console.log(`Fetching subscriptions for service: ${service.name} (${service._id})`);
              
              const subscriptionsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/get/by-service/${service._id}`);
              
              console.log(`Subscriptions response for ${service.name}:`, subscriptionsResponse.data);
              
              if (subscriptionsResponse.data.status === "success" && subscriptionsResponse.data.data) {
                // Handle both single object and array responses
                let subscriptions = [];
                
                if (Array.isArray(subscriptionsResponse.data.data)) {
                  subscriptions = subscriptionsResponse.data.data;
                } else if (typeof subscriptionsResponse.data.data === 'object') {
                  // Single subscription object
                  subscriptions = [subscriptionsResponse.data.data];
                }
                
                const transformedSubscriptions = subscriptions.map((sub: any) => ({
                  id: sub._id,
                  serviceId: service._id,
                  serviceName: service.name,
                  walletAddress: sub.user_id || sub.subscriberAddress || sub.walletAddress || 'Unknown',
                  status: sub.status || 'active',
                  subscribedAt: sub.createdAt || sub.subscribedAt || sub.start_date,
                  nextBilling: sub.nextBilling || sub.next_payment_date,
                  totalPaid: sub.totalPaid || 0
                }));
                
                console.log(`Found ${transformedSubscriptions.length} subscriptions for ${service.name}`);
                allSubscriptions = [...allSubscriptions, ...transformedSubscriptions];
              } else {
                console.log(`No subscriptions found for service: ${service.name}`);
              }
            } catch (error: any) {
              console.error(`Error fetching subscriptions for service ${service._id}:`, error);
              
              // If it's a 404, that's fine - just means no subscriptions
              if (error.response?.status !== 404) {
                console.error(`Unexpected error for service ${service.name}:`, error.message);
              } else {
                console.log(`No subscriptions found for service: ${service.name} (404)`);
              }
            }
          })
        );
        
        console.log(`Total subscriptions found: ${allSubscriptions.length}`);
        setSubscribers(allSubscriptions);
      }
    } catch (error) {
      console.error("Error fetching all subscriptions:", error);
    }
  };

  // Load data when component mounts or account changes
  useEffect(() => {
    if (account?._id) {
      fetchServicesByProvider();
      fetchAllSubscriptions();
    } else {
      // No account connected - clear data and stop loading
      setServices([]);
      setSubscribers([]);
      setPayments([]);
      setLoading(false);
    }
  }, [account?._id]);

  // Fetch payments after subscribers are loaded
  useEffect(() => {
    if (subscribers.length > 0) {
      fetchAllPayments();
    }
  }, [subscribers]);

  const totalSubscribers = services.reduce((sum, service) => sum + service.subscribers, 0);
  const activeServices = services.filter(s => s.status === 'active').length;
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const successRate = payments.length > 0 
    ? ((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1)
    : '0';

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#21262D] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center mx-auto mb-4">
            <TbRobot className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to access the dashboard</p>
          <Link href="/">
            <button className="px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg font-semibold hover:scale-105 transition-transform">
              Go Back Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#21262D] text-white">
      {/* Header */}
      <div className="border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
                  <TbRobot className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Tito Dashboard</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1F2937] border-r border-gray-700 min-h-screen">
          <nav className="p-4 space-y-2">
            <NavItem 
              icon={<BarChart3 className="w-5 h-5" />}
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem 
              icon={<Settings className="w-5 h-5" />}
              label="Services"
              active={activeTab === 'services'}
              onClick={() => setActiveTab('services')}
            />
            <NavItem 
              icon={<CreditCard className="w-5 h-5" />}
              label="Payments"
              active={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
            />
            <NavItem 
              icon={<Users className="w-5 h-5" />}
              label="Subscribers"
              active={activeTab === 'subscribers'}
              onClick={() => setActiveTab('subscribers')}
            />
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab 
                  services={services}
                  totalSubscribers={totalSubscribers}
                  activeServices={activeServices}
                  payments={payments}
                  totalRevenue={totalRevenue}
                  successRate={successRate}
                />
              )}
              
              {activeTab === 'services' && (
                <ServicesTab 
                  services={services}
                  setServices={setServices}
                  showCreateService={showCreateService}
                  setShowCreateService={setShowCreateService}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onServiceCreated={() => {
                    fetchServicesByProvider();
                    fetchAllSubscriptions();
                  }}
                />
              )}
              
              {activeTab === 'payments' && (
                <PaymentsTab 
                  payments={payments}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              )}
              
              {activeTab === 'subscribers' && (
                <SubscribersTab 
                  subscribers={subscribers}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onPaymentsFetch={fetchPaymentsBySubscription}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
      active 
        ? "bg-[#6366F1] text-white" 
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    )}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

// Overview Tab Component
const OverviewTab = ({ 
  services, 
  totalSubscribers, 
  activeServices, 
  payments,
  totalRevenue,
  successRate
}: {
  services: Service[];
  totalSubscribers: number;
  activeServices: number;
  payments: Payment[];
  totalRevenue: number;
  successRate: string;
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      <div className="text-sm text-gray-400">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatsCard
        title="Total Subscribers"
        value={totalSubscribers.toLocaleString()}
        icon={<Users className="w-8 h-8" />}
        trend="+8.2%"
        trendUp={true}
      />
      <StatsCard
        title="Active Services"
        value={activeServices.toString()}
        icon={<Settings className="w-8 h-8" />}
        trend="0%"
        trendUp={null}
      />
      <StatsCard
        title="Total Revenue"
        value={`$${totalRevenue.toFixed(2)}`}
        icon={<DollarSign className="w-8 h-8" />}
        trend="+15.3%"
        trendUp={true}
      />
      <StatsCard
        title="Success Rate"
        value={`${successRate}%`}
        icon={<TbChartLine className="w-8 h-8" />}
        trend="+2.1%"
        trendUp={true}
      />
    </div>

    {/* Top Services */}
    <div className="bg-[#1F2937] rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">Top Performing Services</h2>
      <div className="space-y-4">
        {services.length > 0 ? (
          services
            .sort((a, b) => b.subscribers - a.subscribers)
            .slice(0, 3)
            .map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-gray-400">{service.subscribers} subscribers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">${service.price}/{service.billingCycle}</p>
                  <p className="text-xs text-green-400">
                    Revenue: ${(service.price * service.subscribers).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No services created yet</p>
          </div>
        )}
      </div>
    </div>

    {/* Recent Payments */}
    <div className="bg-[#1F2937] rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.slice(0, 5).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  payment.status === 'completed' ? 'bg-green-500' :
                  payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <div>
                  <p className="font-medium">{payment.serviceName}</p>
                  <p className="text-sm text-gray-400">{payment.customerWallet}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${payment.amount}</p>
                <p className="text-sm text-gray-400">{new Date(payment.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No payments yet</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Services Tab Component
const ServicesTab = ({ 
  services, 
  setServices, 
  showCreateService, 
  setShowCreateService,
  searchTerm,
  setSearchTerm,
  onServiceCreated
}: {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  showCreateService: boolean;
  setShowCreateService: React.Dispatch<React.SetStateAction<boolean>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  onServiceCreated: () => void;
}) => {
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Services Management</h1>
        <button
          onClick={() => setShowCreateService(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg font-semibold hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          Create Service
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#1F2937] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
        />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Services Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? "No services match your search criteria." : "You haven't created any services yet."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateService(true)}
                className="px-6 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg font-semibold hover:scale-105 transition-transform"
              >
                Create Your First Service
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Service Modal */}
      {showCreateService && (
        <CreateServiceModal
          onClose={() => setShowCreateService(false)}
          onSuccess={() => {
            setShowCreateService(false);
            onServiceCreated();
          }}
        />
      )}
    </div>
  );
};

// Payments Tab Component  
const PaymentsTab = ({ 
  payments, 
  searchTerm, 
  setSearchTerm 
}: {
  payments: Payment[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const filteredPayments = payments.filter(payment =>
    payment.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerWallet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payments</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Total: {payments.length} payments
          </div>
          <select className="px-4 py-2 bg-[#1F2937] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]">
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Failed</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search payments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#1F2937] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-[#1F2937] rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Service</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">No Payments Found</h3>
                    <p className="text-gray-400">
                      {searchTerm ? "No payments match your search criteria." : "No payments yet."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Subscribers Tab Component
const SubscribersTab = ({ 
  subscribers, 
  searchTerm, 
  setSearchTerm,
  onPaymentsFetch
}: {
  subscribers: Subscriber[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  onPaymentsFetch: (subscriptionId: string) => Promise<Payment[]>;
}) => {
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [subscriberPayments, setSubscriberPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPayments = async (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setLoadingPayments(true);
    
    try {
      const payments = await onPaymentsFetch(subscriber.id);
      setSubscriberPayments(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Total: {subscribers.length} subscribers
          </div>
          <select className="px-4 py-2 bg-[#1F2937] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]">
            <option>All Status</option>
            <option>Active</option>
            <option>Cancelled</option>
            <option>Expired</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search subscribers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#1F2937] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
        />
      </div>

      {/* Subscribers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubscribers.length > 0 ? (
          filteredSubscribers.map((subscriber) => (
            <SubscriberCard 
              key={subscriber.id} 
              subscriber={subscriber} 
              onViewPayments={() => handleViewPayments(subscriber)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Subscribers Found</h3>
            <p className="text-gray-400">
              {searchTerm ? "No subscribers match your search criteria." : "No subscribers yet."}
            </p>
          </div>
        )}
      </div>

      {/* Payments Modal */}
      {selectedSubscriber && (
        <PaymentsModal
          subscriber={selectedSubscriber}
          payments={subscriberPayments}
          loading={loadingPayments}
          onClose={() => {
            setSelectedSubscriber(null);
            setSubscriberPayments([]);
          }}
        />
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp 
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean | null;
}) => (
  <div className="bg-[#1F2937] rounded-xl border border-gray-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-lg text-[#6366F1]">
        {icon}
      </div>
      {trendUp !== null && (
        <div className={cn(
          "flex items-center gap-1 text-sm",
          trendUp ? "text-green-400" : "text-red-400"
        )}>
          {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400">{title}</p>
    </div>
  </div>
);

// Service Card Component
const ServiceCard = ({ service }: { service: Service }) => (
  <div className="bg-[#1F2937] rounded-xl border border-gray-700 p-6 hover:border-[#6366F1]/50 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className={cn(
        "px-3 py-1 rounded-full text-xs font-medium",
        service.status === 'active' ? 'bg-green-500/20 text-green-400' :
        service.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-gray-500/20 text-gray-400'
      )}>
        {service.status ? service.status.charAt(0).toUpperCase() + service.status.slice(1) : 'Unknown'}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
        <p className="text-sm text-gray-400">{service.description}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-green-400">${service.price}</p>
          <p className="text-xs text-gray-400">per {service.billingCycle}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{service.subscribers}</p>
          <p className="text-xs text-gray-400">subscribers</p>
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Monthly Revenue</span>
          <span className="font-semibold text-green-400">
            ${(service.price * service.subscribers * (service.billingCycle === 'yearly' ? 1/12 : service.billingCycle === 'weekly' ? 4 : 1)).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Payment Row Component
const PaymentRow = ({ payment }: { payment: Payment }) => (
  <tr className="hover:bg-gray-700/50">
    <td className="px-6 py-4">
      <div>
        <p className="font-medium text-white">{payment.serviceName}</p>
        <p className="text-sm text-gray-400">ID: {payment.serviceId}</p>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="font-mono text-sm">
        {payment.customerWallet}
      </div>
    </td>
    <td className="px-6 py-4">
      <span className="font-semibold text-green-400">${payment.amount}</span>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        {payment.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
        {payment.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
        {payment.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-400" />}
        <span className={cn(
          "text-sm font-medium",
          payment.status === 'completed' ? 'text-green-400' :
          payment.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
        )}>
          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-gray-400">
      {new Date(payment.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4">
      {payment.txHash ? (
        <button className="text-[#6366F1] hover:text-[#8B5CF6] text-sm font-mono">
          {payment.txHash.slice(0, 8)}...
        </button>
      ) : (
        <span className="text-gray-500">-</span>
      )}
    </td>
  </tr>
);

// Subscriber Card Component
const SubscriberCard = ({ 
  subscriber, 
  onViewPayments 
}: { 
  subscriber: Subscriber;
  onViewPayments: () => void;
}) => (
  <div className="bg-[#1F2937] rounded-xl border border-gray-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={cn(
        "px-3 py-1 rounded-full text-xs font-medium",
        subscriber.status === 'active' ? 'bg-green-500/20 text-green-400' :
        subscriber.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
        'bg-gray-500/20 text-gray-400'
      )}>
        {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onViewPayments}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="View Payments"
        >
          <CreditCard className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-white">{subscriber.serviceName}</h3>
        <p className="text-sm text-gray-400 font-mono">{subscriber.walletAddress}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400">Subscribed</p>
          <p className="text-sm font-medium">{new Date(subscriber.subscribedAt).toLocaleDateString()}</p>
        </div>
        {subscriber.nextBilling && (
          <div>
            <p className="text-xs text-gray-400">Next Billing</p>
            <p className="text-sm font-medium">{new Date(subscriber.nextBilling).toLocaleDateString()}</p>
          </div>
        )}
      </div>
      
      <div className="pt-3 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total Paid</span>
          <span className="font-semibold text-green-400">${subscriber.totalPaid}</span>
        </div>
      </div>
    </div>
  </div>
);

// Payments Modal Component
const PaymentsModal = ({
  subscriber,
  payments,
  loading,
  onClose
}: {
  subscriber: Subscriber;
  payments: Payment[];
  loading: boolean;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-[#1F2937] to-[#374151] p-8 rounded-3xl border border-gray-700 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Payment History</h2>
        </div>
        <p className="text-gray-400">
          Payments for {subscriber.serviceName} - {subscriber.walletAddress}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading payments...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.length > 0 ? (
            <div className="bg-gray-800/50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-400">${payment.amount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {payment.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {payment.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                          {payment.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-400" />}
                          <span className={cn(
                            "text-sm font-medium",
                            payment.status === 'completed' ? 'text-green-400' :
                            payment.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {payment.txHash ? (
                          <button className="text-[#6366F1] hover:text-[#8B5CF6] text-sm font-mono">
                            {payment.txHash.slice(0, 12)}...
                          </button>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Payments Found</h3>
              <p className="text-gray-400">No payment history for this subscription yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

// Create Service Modal Component
const CreateServiceModal = ({ 
  onClose, 
  onSuccess 
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly' | 'weekly',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { account } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account?._id) {
      toast.error('No provider account found');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const serviceData = {
        provider_id: account._id,
        name: formData.name,
        description: formData.description,
        pricing: {
          amount: parseFloat(formData.price),
          billingCycle: formData.billingCycle,
        }
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/services-k/new`, serviceData);
      
      if (response.data.status === "success") {
        toast.success('Service created successfully!');
        onSuccess();
      } else {
        toast.error('Failed to create service');
      }
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error('Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1F2937] to-[#374151] p-8 rounded-3xl border border-gray-700 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create New Service</h2>
          </div>
          <p className="text-gray-400">Set up a new subscription service for your customers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                placeholder="e.g., Premium Streaming"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent resize-none"
              placeholder="Describe your service..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                placeholder="9.99"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Billing Cycle *
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({...formData, billingCycle: e.target.value as any})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-600 rounded-lg font-semibold text-white hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg font-semibold text-white transition-transform",
                isSubmitting 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:scale-105"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Service'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardPage;