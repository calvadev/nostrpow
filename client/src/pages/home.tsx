import { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { NoteFeed } from "@/components/note-feed";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("pow_desc");
  const [minPowDifficulty, setMinPowDifficulty] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Sidebar
              sortBy={sortBy}
              minPowDifficulty={minPowDifficulty}
              onSortChange={setSortBy}
              onMinPowChange={setMinPowDifficulty}
            />
          </aside>
          
          {/* Main Feed */}
          <main className="lg:col-span-3">
            <NoteFeed
              sortBy={sortBy}
              minPowDifficulty={minPowDifficulty}
              searchQuery={searchQuery}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
