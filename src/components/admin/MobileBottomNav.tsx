import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  ShoppingCart,
  Plus,
  User,
  Home,
} from "lucide-react";

export default function MobileBottomNav() {
  const navigate = useNavigate();

  return createPortal(
    <nav
      className="fixed z-[9999] md:hidden"
      style={{
        bottom: 15,
        left: 10,
        right: 10,
      }}
      dir="rtl"
    >
      <div
        className="mobile-bottom-nav-glass relative flex items-center justify-around rounded-[22px] px-2 py-2"
        style={{
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.15) inset",
        }}
      >
        {/* Right two items */}
        <NavItem to="/admin/analytics" icon={Home} label="الرئيسية" />
        <NavItem to="/admin/orders" icon={ShoppingCart} label="الطلبات" />

        {/* Center floating FAB */}
        <div className="relative flex flex-col items-center" style={{ width: 64 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/admin/products/new")}
            className="absolute -top-8 w-[58px] h-[58px] rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #00c853, #00e676)",
              boxShadow: "0 8px 25px rgba(0, 200, 83, 0.5)",
            }}
          >
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </motion.button>
          <span className="text-[10px] mt-7 font-medium" style={{ color: "#8a8a8a" }}>
            إضافة
          </span>
        </div>

        {/* Left two items */}
        <NavItem to="/admin/products" icon={BarChart3} label="المنتجات" />
        <NavItem to="/admin/settings" icon={User} label="الحساب" />
      </div>

      <style>{`
        .mobile-bottom-nav-glass {
          background: rgba(255, 255, 255, 0.9);
        }
        .dark .mobile-bottom-nav-glass {
          background: rgba(15, 15, 20, 0.85);
          border-color: rgba(255,255,255,0.08);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06) inset;
        }
      `}</style>
    </nav>,
    document.body
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className="flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[52px]"
    >
      {({ isActive }) => (
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-250"
          style={
            isActive
              ? { background: "rgba(0, 200, 83, 0.1)" }
              : {}
          }
        >
          <Icon
            className="w-[22px] h-[22px] transition-colors duration-200"
            style={{ color: isActive ? "#00c853" : "#8a8a8a" }}
            strokeWidth={2}
          />
          <span
            className="text-[10px] font-semibold transition-colors duration-200"
            style={{ color: isActive ? "#00c853" : "#8a8a8a" }}
          >
            {label}
          </span>
        </motion.div>
      )}
    </NavLink>
  );
}
