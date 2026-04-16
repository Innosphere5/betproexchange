import DashboardLayoutComponent from "../../components/DashboardLayout";

export const metadata = {
  title: "Dashboard | BetProExchange",
}

export default function DashboardLayout({ children }) {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>;
}
