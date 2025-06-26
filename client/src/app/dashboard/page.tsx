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

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  subscribers: number;
  revenue: number;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  category: string;
}

interface Payment {
  id: string;
  serviceId: string;
  serviceName: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'payments' | 'subscribers'>('overview');
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [showCreateService, setShowCreateService] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setServices([
        {
          id: '1',
          name: 'Premium Streaming',
          description: 'High-quality video streaming service',
          price: 15.99,
          billingCycle: 'monthly',
          subscribers: 1247,
          revenue: 19941.53,
          status: 'active',
          createdAt: '2024-01-15',
          category: 'Entertainment'
        },
        {
          id: '2',
          name: 'Cloud Storage Pro',
          description: 'Secure cloud storage with 1TB space',
          price: 9.99,
          billingCycle: 'monthly',
          subscribers: 892,
          revenue: 8911.08,
          status: 'active',
          createdAt: '2024-02-01',
          category: 'Storage'
        },
        {
          id: '3',
          name: 'Design Tools Suite',
          description: 'Professional design tools and templates',
          price: 29.99,
          billingCycle: 'monthly',
          subscribers: 456,
          revenue: 13675.44,
          status: 'active',
          createdAt: '2024-01-10',
          category: 'Design'
        }
      ]);

      setPayments([
        {
          id: '1',
          serviceId: '1',
          serviceName: 'Premium Streaming',
          amount: 15.99,
          status: 'completed',
          customerWallet: '0x1234...5678',
          txHash: '0xabcd...efgh',
          createdAt: '2024-03-15T10:30:00Z'
        },
        {
          id: '2',
          serviceId: '2',
          serviceName: 'Cloud Storage Pro',
          amount: 9.99,
          status: 'completed',
          customerWallet: '0x2345...6789',
          txHash: '0xbcde...fghi',
          createdAt: '2024-03-15T09:15:00Z'
        },
        {
          id: '3',
          serviceId: '1',
          serviceName: 'Premium Streaming',
          amount: 15.99,
          status: 'pending',
          customerWallet: '0x3456...7890',
          createdAt: '2024-03-15T08:45:00Z'
        }
      ]);

      setSubscribers([
        {
          id: '1',
          serviceId: '1',
          serviceName: 'Premium Streaming',
          walletAddress: '0x1234...5678',
          status: 'active',
          subscribedAt: '2024-01-15',
          nextBilling: '2024-04-15',
          totalPaid: 47.97
        },
        {
          id: '2',
          serviceId: '2',
          serviceName: 'Cloud Storage Pro',
          walletAddress: '0x2345...6789',
          status: 'active',
          subscribedAt: '2024-02-01',
          nextBilling: '2024-04-01',
          totalPaid: 19.98
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const totalRevenue = services.reduce((sum, service) => sum + service.revenue, 0);
  const totalSubscribers = services.reduce((sum, service) => sum + service.subscribers, 0);
  const activeServices = services.filter(s => s.status === 'active').length;

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
          {activeTab === 'overview' && (
            <OverviewTab 
              services={services}
              totalRevenue={totalRevenue}
              totalSubscribers={totalSubscribers}
              activeServices={activeServices}
              payments={payments}
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
            />
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
  totalRevenue, 
  totalSubscribers, 
  activeServices, 
  payments 
}: {
  services: Service[];
  totalRevenue: number;
  totalSubscribers: number;
  activeServices: number;
  payments: Payment[];
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
        title="Total Revenue"
        value={`$${totalRevenue.toLocaleString()}`}
        icon={<DollarSign className="w-8 h-8" />}
        trend="+12.5%"
        trendUp={true}
      />
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
        title="Success Rate"
        value="98.5%"
        icon={<TbChartLine className="w-8 h-8" />}
        trend="+2.1%"
        trendUp={true}
      />
    </div>

    {/* Top Services */}
    <div className="bg-[#1F2937] rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">Top Performing Services</h2>
      <div className="space-y-4">
        {services.slice(0, 3).map((service) => (
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
              <p className="font-semibold text-green-400">${service.revenue.toLocaleString()}</p>
              <p className="text-sm text-gray-400">${service.price}/{service.billingCycle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Recent Payments */}
    <div className="bg-[#1F2937] rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
      <div className="space-y-3">
        {payments.slice(0, 5).map((payment) => (
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
        ))}
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
  setSearchTerm
}: {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  showCreateService: boolean;
  setShowCreateService: React.Dispatch<React.SetStateAction<boolean>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
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
        {filteredServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {/* Create Service Modal */}
      {showCreateService && (
        <CreateServiceModal
          onClose={() => setShowCreateService(false)}
          onSubmit={(newService) => {
            setServices(prev => [...prev, { ...newService, id: Date.now().toString() }]);
            setShowCreateService(false);
            toast.success('Service created successfully!');
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
              {filteredPayments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
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
  setSearchTerm 
}: {
  subscribers: Subscriber[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <div className="flex items-center gap-4">
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
        {filteredSubscribers.map((subscriber) => (
          <SubscriberCard key={subscriber.id} subscriber={subscriber} />
        ))}
      </div>
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
        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
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
          <span className="text-sm text-gray-400">Revenue</span>
          <span className="font-semibold text-green-400">${service.revenue.toLocaleString()}</span>
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
const SubscriberCard = ({ subscriber }: { subscriber: Subscriber }) => (
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

// Create Service Modal Component
const CreateServiceModal = ({ 
  onClose, 
  onSubmit 
}: {
  onClose: () => void;
  onSubmit: (service: Omit<Service, 'id'>) => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly' | 'weekly',
    category: '',
    status: 'draft' as 'active' | 'paused' | 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      billingCycle: formData.billingCycle,
      category: formData.category,
      status: formData.status,
      subscribers: 0,
      revenue: 0,
      createdAt: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1F2937] to-[#374151] p-8 rounded-3xl border border-gray-700 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
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
            <div>
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
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
              >
                <option value="">Select Category</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Storage">Storage</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Analytics">Analytics</option>
                <option value="Other">Other</option>
              </select>
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
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (USD) *
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
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-600 rounded-lg font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg font-semibold text-white hover:scale-105 transition-transform"
            >
              Create Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardPage;