import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Award, TrendingUp, Clock } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-cream pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-card p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-primary rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user.username
                }
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current ELO */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current ELO Rating</p>
                <p className="text-2xl font-bold text-blue-primary">{user.current_elo}</p>
              </div>
              <Award className="text-blue-primary" size={24} />
            </div>
          </div>

          {/* Peak ELO */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Peak ELO Rating</p>
                <p className="text-2xl font-bold text-green-600">{user.peak_elo}</p>
              </div>
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>

          {/* Last Active */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Active</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user.last_login ? formatDate(user.last_login) : 'Never'}
                </p>
              </div>
              <Clock className="text-gray-500" size={24} />
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <p className="text-gray-900">{user.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>

            {user.first_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <p className="text-gray-900">{user.first_name}</p>
              </div>
            )}

            {user.last_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <p className="text-gray-900">{user.last_name}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Created
              </label>
              <p className="text-gray-900">{formatDate(user.created_at)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Status
              </label>
              <p className="text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ELO Rating Info */}
        <div className="bg-white rounded-xl shadow-card p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About ELO Rating</h2>
          <div className="text-gray-600 space-y-2">
            <p>
              Your ELO rating reflects your current skill level in SAT questions. It starts at 1200 and adjusts based on your performance:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Correct answers increase your rating</li>
              <li>Incorrect answers decrease your rating</li>
              <li>The amount of change depends on the question difficulty and your current rating</li>
              <li>Higher ratings unlock more challenging practice questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}