import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import { MdSpaceDashboard } from "react-icons/md";
import { FaBook } from "react-icons/fa";
import { HiNewspaper } from "react-icons/hi2";
import { IoMdTrendingUp } from "react-icons/io";
import { RxDotsHorizontal } from "react-icons/rx";


// Keep using your existing icons + context exactly the same
import {
  ChevronDownIcon,
} from "../icons";

import { useSidebar } from "../context/SidebarContext";
// import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

/**
 * ✅ Only the CONTENT changes below (paths + names)
 * UI/logic stays exactly the same.
 */
const navItems: NavItem[] = [
  {
    icon: <MdSpaceDashboard size={30} />,
    name: "Dashboard",
    path: "/admin/dashboard",
  },
  {
    icon: <FaBook size={20} />,
    name: "Review Queue",
    path: "/admin/review-queue",
  },
  {
    icon: <HiNewspaper size={30} />,
    name: "All Applications",
    path: "/admin/applications",
  },
  {
    icon: <IoMdTrendingUp size={30} />,
    name: "My Activity",
    path: "/admin/activity",
  },
];

const todayStats ={
    reviewed: 120,
    approved: 85,
    rejected: 35,
}


const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Auto-open submenu when a sub-route is active
  useEffect(() => {
    let submenuMatched = false;

    (["main", "others"] as const).forEach((menuType) => {
      const items = menuType === "main" ? navItems : []; // Add othersNavItems if you have them

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  // Measure submenu height for smooth expand/collapse animation
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              }`}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center shrink-0 ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{nav.name}</span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center shrink-0 ${
                    isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo area */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/admin/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src={Logo}
                alt="Logo"
                width={110}
                height={30}
              />
              <img
                className="hidden dark:block"
                src={Logo}
                alt="Logo"
                width={150}
                height={90}
              />
            </>
          ) : (
            <img
              src={Logo}
              alt="Logo"
              width={110}
              height={30}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* MAIN */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <RxDotsHorizontal className="size-6" />
                )}
              </h2>

              {renderMenuItems(navItems, "main")}

            </div>

            {/* OTHERS */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <RxDotsHorizontal className="size-6" />
                )}
              </h2>

              <div className={`p-4 border-t border-[#E2E8F0] ${ !isExpanded && !isHovered ? "hidden" : "justify-start"}`}>
          <div className="bg-[#F8FAFC] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Today's Activity</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Reviewed</span>
                <span className="font-semibold text-[#1E293B]">{todayStats.reviewed}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Approved</span>
                <span className="font-semibold text-[#10B981]">{todayStats.approved}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Rejected</span>
                <span className="font-semibold text-[#EF4444]">{todayStats.rejected}</span>
              </div>
            </div>
          </div>
        </div>
            </div>
          </div>
        </nav>

        {isExpanded || isHovered || isMobileOpen ? null : (
          <div className="p-4 text-center text-sm text-gray-500">
            <p>Admin Sidebar is collapsed</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;