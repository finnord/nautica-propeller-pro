import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { KeyboardShortcutsProvider } from "@/contexts/KeyboardShortcutsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import ProductEdit from "./pages/ProductEdit";
import ProductNew from "./pages/ProductNew";
import Customers from "./pages/Customers";
import RFQ from "./pages/RFQ";
import RFQNew from "./pages/RFQNew";
import Search from "./pages/Search";
import Equivalences from "./pages/Equivalences";
import EquivalenceNew from "./pages/EquivalenceNew";
import ImportExport from "./pages/ImportExport";
import { PriceListManagement } from "./pages/PriceListManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <KeyboardShortcutsProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductNew />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<ProductEdit />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/rfq" element={<RFQ />} />
          <Route path="/rfq/new" element={<RFQNew />} />
          <Route path="/search" element={<Search />} />
          <Route path="/equivalences" element={<Equivalences />} />
          <Route path="/equivalences/new" element={<EquivalenceNew />} />
          <Route path="/price-lists" element={<PriceListManagement />} />
          <Route path="/import-export" element={<ImportExport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          </KeyboardShortcutsProvider>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
