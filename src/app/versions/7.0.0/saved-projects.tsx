'use client';

import { useState } from 'react';
import { ChevronRight, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SavedProjects() {
  const [activeFilter, setActiveFilter] = useState('Active');
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Your Saved Projects
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what the AI suggests you need to know about this campaign
              </p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={activeFilter === 'Active' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('Active')}
                className={`px-6 py-2 rounded-lg font-medium ${
                  activeFilter === 'Active'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Active
              </Button>
              <Button
                variant={activeFilter === 'All' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('All')}
                className={`px-6 py-2 rounded-lg font-medium ${
                  activeFilter === 'All'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-purple-600 font-medium text-lg cursor-pointer hover:text-purple-700">
              Your Saved Projects
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Date Selector */}
            <Select>
              <SelectTrigger className="w-48 bg-white border-gray-300">
                <SelectValue placeholder="Select Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="flex items-center gap-3">
              <label htmlFor="search" className="text-gray-700 font-medium">
                Search
              </label>
              <Input
                id="search"
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-80 bg-white border-gray-300"
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mb-8">
          {/* Start Research Card */}
          <div className="bg-white rounded-lg p-8 cursor-pointer group w-80 h-80">
            <div className="flex flex-col items-center justify-center text-center h-full border-2 border-dashed border-gray-400 group-hover:border-purple-500 transition-colors rounded-lg">
              <Plus className="w-8 h-8 text-purple-600 mb-3 group-hover:text-purple-700 transition-colors" strokeWidth={2} />
              <h3 className="text-purple-600 font-semibold text-lg group-hover:text-purple-700 transition-colors">
                Start a Research
              </h3>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Showing entries text */}
          <p className="text-gray-600">
            Showing 1-6 of 10 entries
          </p>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Previous
            </Button>
            <Button
              variant="default"
              className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700"
            >
              1
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              2
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}