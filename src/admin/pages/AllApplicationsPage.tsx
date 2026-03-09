import React, { useState } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import  Badge  from '../Badge';
import { Button } from '../ui/Button';
import { mockApplications } from '../data/mockData';
import { formatDistanceToNow, format } from 'date-fns';

const AllApplicationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  
  const filteredApps = mockApplications.filter(app => {
    const matchesSearch = 
      app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApps = filteredApps.slice(startIndex, endIndex);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">All Applications</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {filteredApps.length} total application{filteredApps.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search applications..."
            className="w-full h-10 pl-10 pr-4 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
          />
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#64748B]" />
          <span className="text-sm text-[#64748B]">Status:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
        >
          <option value="all">All</option>
          <option value="queued">Queued</option>
          <option value="drafting">Drafting</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="submitted">Submitted</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        {(searchTerm || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="text-sm text-[#2563EB] hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Job Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Submitted
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {currentApps.map((app) => (
                <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {app.clientName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm text-[#1E293B]">{app.clientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1E293B]">
                    {app.company}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {app.jobTitle}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {format(app.submittedAt, 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {formatDistanceToNow(app.lastUpdated, { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="secondary" size="sm" className="gap-1">
                      <Eye size={14} />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <div className="text-sm text-[#64748B]">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredApps.length)} of {filteredApps.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <div className="text-sm text-[#64748B]">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllApplicationsPage;