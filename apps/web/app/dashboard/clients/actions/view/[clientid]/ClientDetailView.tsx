"use client";

import { useState } from "react";
import { ClientDetail } from "@/lib/services/clients";

import ClientTabs from "@/components/clients/view/tabs/ClientTabs";
import BookingsSection from "@/components/clients/view/bookings/BookingsSection";
import ReviewsSection from "@/components/clients/view/reviews/ReviewsSection";
import SalesSection from "@/components/clients/view/sales/SalesSection";
import RewardsSection from "@/components/clients/view/rewards/RewardsSection";

type Tab = "overview" | "bookings" | "sales" | "rewards" | "reviews";

interface Props {
  data: ClientDetail;
}

export default function ClientDetailView({ data }: Props) {
  const { client, bookings, reviews } = data;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white">
      <ClientTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {activeTab === "overview" && (
          <BookingsSection bookings={bookings} />
        )}

        {activeTab === "reviews" && (
          <ReviewsSection reviews={reviews} />
        )}

        {activeTab === "bookings" && (
          <BookingsSection bookings={bookings} />
        )}

        {activeTab === "sales" && (
          <SalesSection bookings={bookings} />
        )}

        {activeTab === "rewards" && (
          <RewardsSection client={client} />
        )}
      </div>
    </div>
  );
}