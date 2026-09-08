// src/pages/PathwaysPage.jsx
import React11, { useState as useState7, useEffect as useEffect6, useRef as useRef4, useMemo, useCallback } from "react";
import { useNavigate as useNavigate3, useLocation as useLocation2 } from "react-router-dom";

// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// src/api/client.js
import axios from "axios";
var baseURL = "http://localhost:8000";
var apiClient = axios.create({
  baseURL,
  timeout: 1e4,
  headers: {
    "Content-Type": "application/json"
  }
});
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
var isRefreshing = false;
var failedQueue = [];
var processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response || error.response.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    const isAuthEndpoint = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/register") || originalRequest.url?.includes("/auth/refresh");
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (typeof window !== "undefined" && !["/login", "/register", "/"].includes(window.location.pathname)) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }).catch((err) => Promise.reject(err));
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const response = await axios.post(`${baseURL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken
      });
      const { access_token } = response.data;
      localStorage.setItem("access_token", access_token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      processQueue(null, access_token);
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (typeof window !== "undefined" && !["/login", "/register", "/"].includes(window.location.pathname)) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
var updateMyProfileApi = async (data) => {
  const response = await apiClient.put("/api/v1/students/profile/me", data);
  return response.data;
};
var updateMyAcademicStageApi = async (data) => {
  const response = await apiClient.put("/api/v1/students/profile/academic-stage", data);
  return response.data;
};
var getPathwaysApi = async (params = {}) => {
  const cleanParams = {};
  if (params.education_level && typeof params.education_level === "string" && params.education_level.trim()) {
    cleanParams.education_level = params.education_level.trim();
  }
  if (params.stream && typeof params.stream === "string" && params.stream.trim()) {
    cleanParams.stream = params.stream.trim();
  }
  const response = await apiClient.get("/api/v1/roadmaps/pathways", { params: cleanParams });
  return response.data;
};
var getPathwayDetailApi = async (pathwayId) => {
  const response = await apiClient.get(`/api/v1/roadmaps/pathways/${encodeURIComponent(pathwayId)}`);
  return response.data;
};
var createStudentGoalApi = async (pathwayId, pathwayOptionId = null) => {
  const response = await apiClient.post("/api/v1/roadmaps/goals", {
    pathway_id: pathwayId,
    pathway_option_id: pathwayOptionId
  });
  return response.data;
};
var getLatestRecommendationsApi = async () => {
  const response = await apiClient.get("/api/v1/career-intelligence/recommendations/me");
  return response.data;
};

// src/context/AuthContext.jsx
var AuthContext = createContext(null);
var useAuth = () => useContext(AuthContext);

// src/context/SidebarContext.jsx
import React2, { createContext as createContext2, useContext as useContext2, useState as useState2, useEffect as useEffect2 } from "react";
var SidebarContext = createContext2();
var useSidebar = () => {
  const context = useContext2(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// src/components/Sidebar.jsx
import React3 from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Sparkles,
  Map,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
var Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navItems = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "Career Discovery Assessment", icon: Sparkles, path: "/assessment" },
    { label: "Explore Pathways", icon: Compass, path: "/pathways" },
    { label: "My Career Roadmap", icon: Map, path: "/my-roadmap" }
  ];
  const handleNavClick = (path) => {
    if (path) {
      navigate(path);
      if (onClose) onClose();
    }
  };
  return /* @__PURE__ */ React3.createElement(React3.Fragment, null, isOpen && /* @__PURE__ */ React3.createElement(
    "div",
    {
      className: "fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden",
      onClick: onClose
    }
  ), /* @__PURE__ */ React3.createElement(
    "aside",
    {
      className: `fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between transition-all duration-200 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`
    },
    /* @__PURE__ */ React3.createElement("div", { className: "flex-1 overflow-y-auto py-5 px-3 space-y-5" }, /* @__PURE__ */ React3.createElement("div", { className: `flex items-center ${isCollapsed ? "justify-center lg:justify-center" : "justify-between"} px-1` }, /* @__PURE__ */ React3.createElement(Link, { to: "/dashboard", className: "flex items-center space-x-2.5 group", title: "Udaan AI Dashboard" }, /* @__PURE__ */ React3.createElement("div", { className: "w-10 h-10 rounded-2xl bg-[#005F60] flex items-center justify-center text-white shadow-md shadow-[#005F60]/20 group-hover:scale-105 transition-transform shrink-0" }, /* @__PURE__ */ React3.createElement(Sparkles, { className: "w-5 h-5 text-white" })), !isCollapsed && /* @__PURE__ */ React3.createElement("div", { className: "hidden lg:block overflow-hidden" }, /* @__PURE__ */ React3.createElement("span", { className: "font-black text-lg tracking-tight text-[#0F172A] block leading-tight" }, "Udaan AI"), /* @__PURE__ */ React3.createElement("span", { className: "text-[9px] text-[#005F60] font-extrabold uppercase tracking-wider block" }, "Karnataka Student")), /* @__PURE__ */ React3.createElement("div", { className: "lg:hidden" }, /* @__PURE__ */ React3.createElement("span", { className: "font-black text-lg tracking-tight text-[#0F172A] block leading-tight" }, "Udaan AI"), /* @__PURE__ */ React3.createElement("span", { className: "text-[9px] text-[#005F60] font-extrabold uppercase tracking-wider block" }, "Karnataka Student"))), !isCollapsed ? /* @__PURE__ */ React3.createElement(
      "button",
      {
        type: "button",
        onClick: toggleSidebar,
        className: "hidden lg:flex text-slate-400 hover:text-[#005F60] hover:bg-teal-50 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0",
        title: "Collapse Sidebar",
        "aria-label": "Collapse Sidebar"
      },
      /* @__PURE__ */ React3.createElement(PanelLeftClose, { className: "w-4 h-4" })
    ) : /* @__PURE__ */ React3.createElement(
      "button",
      {
        type: "button",
        onClick: toggleSidebar,
        className: "hidden lg:flex text-slate-400 hover:text-[#005F60] hover:bg-teal-50 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 mt-2",
        title: "Expand Sidebar",
        "aria-label": "Expand Sidebar"
      },
      /* @__PURE__ */ React3.createElement(PanelLeftOpen, { className: "w-4 h-4" })
    ), /* @__PURE__ */ React3.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "lg:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
      },
      /* @__PURE__ */ React3.createElement(X, { className: "w-5 h-5" })
    )), /* @__PURE__ */ React3.createElement("div", { className: "h-px bg-slate-100 my-1" }), /* @__PURE__ */ React3.createElement("nav", { className: "space-y-1.5" }, navItems.map((item) => {
      const Icon = item.icon;
      const isSelected = location.pathname === item.path;
      return /* @__PURE__ */ React3.createElement(
        "button",
        {
          key: item.label,
          type: "button",
          onClick: () => handleNavClick(item.path),
          title: item.label,
          "aria-label": item.label,
          className: `w-full flex items-center ${isCollapsed ? "justify-center px-0 lg:px-0 py-2.5" : "space-x-3 px-3 py-2.5"} rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected ? "bg-teal-50 text-[#005F60] border border-teal-200/80 shadow-2xs" : "text-slate-600 hover:bg-[#F8FAF8] hover:text-[#0F172A]"}`
        },
        /* @__PURE__ */ React3.createElement(Icon, { className: `w-4 h-4 shrink-0 ${isSelected ? "text-[#005F60]" : "text-slate-400"}` }),
        !isCollapsed && /* @__PURE__ */ React3.createElement("span", { className: "hidden lg:inline truncate" }, item.label),
        /* @__PURE__ */ React3.createElement("span", { className: "lg:hidden truncate" }, item.label)
      );
    }))),
    /* @__PURE__ */ React3.createElement("div", { className: "p-3 border-t border-slate-100 bg-[#F8FAF8] space-y-2" }, !isCollapsed ? /* @__PURE__ */ React3.createElement("div", { className: "hidden lg:flex px-3 py-2 rounded-xl bg-teal-50/80 border border-teal-100 text-[11px] text-[#005F60] items-center space-x-2" }, /* @__PURE__ */ React3.createElement("div", { className: "w-2 h-2 rounded-full bg-[#005F60] animate-pulse shrink-0" }), /* @__PURE__ */ React3.createElement("span", { className: "font-extrabold truncate" }, "Karnataka Edition")) : /* @__PURE__ */ React3.createElement("div", { className: "hidden lg:flex justify-center py-1" }, /* @__PURE__ */ React3.createElement("div", { className: "w-2.5 h-2.5 rounded-full bg-[#005F60] animate-pulse", title: "Karnataka Student Edition" })), /* @__PURE__ */ React3.createElement("div", { className: "lg:hidden px-3 py-2 rounded-xl bg-teal-50/80 border border-teal-100 text-[11px] text-[#005F60] flex items-center space-x-2" }, /* @__PURE__ */ React3.createElement("div", { className: "w-2 h-2 rounded-full bg-[#005F60] animate-pulse shrink-0" }), /* @__PURE__ */ React3.createElement("span", { className: "font-extrabold truncate" }, "Karnataka Edition")), /* @__PURE__ */ React3.createElement(
      "button",
      {
        type: "button",
        onClick: logout,
        title: "Sign Out",
        "aria-label": "Sign Out",
        className: `w-full flex items-center ${isCollapsed ? "justify-center py-2" : "justify-center space-x-2 px-3 py-2"} rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200/60 cursor-pointer`
      },
      /* @__PURE__ */ React3.createElement(LogOut, { className: "w-3.5 h-3.5 shrink-0" }),
      !isCollapsed && /* @__PURE__ */ React3.createElement("span", { className: "hidden lg:inline" }, "Sign Out"),
      /* @__PURE__ */ React3.createElement("span", { className: "lg:hidden" }, "Sign Out")
    ))
  ));
};
var Sidebar_default = Sidebar;

// src/components/Header.jsx
import React4, { useState as useState3, useEffect as useEffect3, useRef } from "react";
import { useNavigate as useNavigate2 } from "react-router-dom";
import {
  Search,
  Menu,
  X as X2,
  ChevronRight,
  AlertCircle
} from "lucide-react";
var QUICK_SEARCH_ITEMS = [
  {
    id: "puc-science",
    title: "PUC Science Stream (PCMB / PCMC)",
    category: "PUC Stream",
    level: "PUC (11th\u201312th)",
    description: "Prepares for Engineering, Medical, Pure Sciences & Technology careers in Karnataka.",
    path: "/pathways?stream=Science&level=PUC&pathway_id=puc-science-eng"
  },
  {
    id: "puc-commerce",
    title: "PUC Commerce Stream (CEBA / SEBA)",
    category: "PUC Stream",
    level: "PUC (11th\u201312th)",
    description: "Prepares for Finance, CA, Business Administration, Economics & Banking.",
    path: "/pathways?stream=Commerce&level=PUC&pathway_id=puc-commerce-fin"
  },
  {
    id: "puc-arts",
    title: "PUC Arts & Humanities (HEPS / EGAS)",
    category: "PUC Stream",
    level: "PUC (11th\u201312th)",
    description: "Prepares for Civil Services, Law, Journalism, Humanities & Design.",
    path: "/pathways?stream=Arts&level=PUC&pathway_id=puc-arts-hum"
  },
  {
    id: "diploma-cs",
    title: "Polytechnic Diploma in Computer Science",
    category: "3-Year Diploma",
    level: "Post Class 10",
    description: "Practical technical training in programming, hardware & software development.",
    path: "/pathways?level=Class%2010&pathway_id=c10-diploma"
  },
  {
    id: "diploma-mech",
    title: "Polytechnic Diploma in Mechanical Engineering",
    category: "3-Year Diploma",
    level: "Post Class 10",
    description: "Manufacturing, machine design, automobile mechanics & industry skills.",
    path: "/pathways?level=Class%2010&pathway_id=c10-diploma"
  },
  {
    id: "iti-electrician",
    title: "ITI Electrician Trade",
    category: "Vocational Trade",
    level: "Post Class 10",
    description: "Electrical wiring, motor control, industrial installations & technician certification.",
    path: "/pathways?level=Class%2010&pathway_id=c10-iti"
  },
  {
    id: "iti-fitter",
    title: "ITI Fitter Trade",
    category: "Vocational Trade",
    level: "Post Class 10",
    description: "Precision machining, assembly, plant maintenance & mechanical trade skills.",
    path: "/pathways?level=Class%2010&pathway_id=c10-iti"
  },
  {
    id: "career-assessment",
    title: "Career Discovery Assessment",
    category: "Self Discovery",
    level: "All Students",
    description: "Take guided interest test mapping your natural aptitude across streams & subjects.",
    path: "/assessment"
  },
  {
    id: "my-roadmap",
    title: "My Career Roadmap & Goals",
    category: "Action Plan",
    level: "Personalized",
    description: "View your target milestones, step-by-step guidance & progress tracker.",
    path: "/my-roadmap"
  }
];
var Header = ({ onMenuClick, onEditProfileClick }) => {
  const navigate = useNavigate2();
  const { user, profile, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState3("");
  const [isSearchOpen, setIsSearchOpen] = useState3(false);
  const searchRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState3(false);
  const dropdownRef = useRef(null);
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  const filteredResults = searchQuery.trim() === "" ? [] : QUICK_SEARCH_ITEMS.filter(
    (item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect3(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSelectSearchResult = (path) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(path);
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (filteredResults.length > 0) {
        handleSelectSearchResult(filteredResults[0].path);
      } else {
        setIsSearchOpen(false);
        navigate("/pathways");
      }
    }
  };
  return /* @__PURE__ */ React4.createElement("header", { className: "bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs" }, /* @__PURE__ */ React4.createElement("div", { className: "flex items-center space-x-4 flex-1 max-w-xl" }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      onClick: onMenuClick,
      className: "lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer",
      title: "Open Menu"
    },
    /* @__PURE__ */ React4.createElement(Menu, { className: "w-5 h-5" })
  ), /* @__PURE__ */ React4.createElement("div", { className: "relative w-full", ref: searchRef }, /* @__PURE__ */ React4.createElement("div", { className: "relative" }, /* @__PURE__ */ React4.createElement(Search, { className: "w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ React4.createElement(
    "input",
    {
      type: "text",
      value: searchQuery,
      onChange: (e) => {
        setSearchQuery(e.target.value);
        setIsSearchOpen(true);
      },
      onFocus: () => setIsSearchOpen(true),
      onKeyDown: handleSearchKeyDown,
      placeholder: "Search pathways, streams, ITI trades, SSLC options...",
      className: "w-full bg-[#F8FAF8] border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60] focus:bg-white transition-all placeholder:text-slate-400 font-medium"
    }
  ), searchQuery && /* @__PURE__ */ React4.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setSearchQuery("");
        setIsSearchOpen(false);
      },
      className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
    },
    /* @__PURE__ */ React4.createElement(X2, { className: "w-3.5 h-3.5" })
  )), isSearchOpen && /* @__PURE__ */ React4.createElement("div", { className: "absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150" }, searchQuery.trim() === "" ? /* @__PURE__ */ React4.createElement("div", { className: "p-4 space-y-2" }, /* @__PURE__ */ React4.createElement("span", { className: "text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1" }, "Quick Suggestions"), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-1.5" }, QUICK_SEARCH_ITEMS.slice(0, 4).map((item) => /* @__PURE__ */ React4.createElement(
    "button",
    {
      key: item.id,
      onClick: () => handleSelectSearchResult(item.path),
      className: "text-left p-2.5 rounded-xl hover:bg-teal-50/70 border border-slate-100 transition-colors group cursor-pointer"
    },
    /* @__PURE__ */ React4.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React4.createElement("span", { className: "text-xs font-bold text-[#0F172A] group-hover:text-[#005F60]" }, item.title), /* @__PURE__ */ React4.createElement(ChevronRight, { className: "w-3.5 h-3.5 text-slate-400 group-hover:text-[#005F60]" })),
    /* @__PURE__ */ React4.createElement("span", { className: "text-[10px] font-semibold text-slate-500 block mt-0.5" }, item.category)
  )))) : filteredResults.length > 0 ? /* @__PURE__ */ React4.createElement("div", { className: "max-h-80 overflow-y-auto divide-y divide-slate-100 p-2" }, /* @__PURE__ */ React4.createElement("div", { className: "px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider" }, "Found ", filteredResults.length, " result", filteredResults.length > 1 ? "s" : ""), filteredResults.map((item) => /* @__PURE__ */ React4.createElement(
    "button",
    {
      key: item.id,
      onClick: () => handleSelectSearchResult(item.path),
      className: "w-full text-left p-3 rounded-xl hover:bg-teal-50/70 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
    },
    /* @__PURE__ */ React4.createElement("div", { className: "space-y-0.5" }, /* @__PURE__ */ React4.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React4.createElement("span", { className: "text-xs font-bold text-[#0F172A] group-hover:text-[#005F60]" }, item.title), /* @__PURE__ */ React4.createElement("span", { className: "text-[9px] font-extrabold text-[#005F60] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200" }, item.category)), /* @__PURE__ */ React4.createElement("p", { className: "text-xs text-slate-500 line-clamp-1 font-medium" }, item.description)),
    /* @__PURE__ */ React4.createElement(ChevronRight, { className: "w-4 h-4 text-slate-400 group-hover:text-[#005F60] shrink-0 mt-1" })
  ))) : /* @__PURE__ */ React4.createElement("div", { className: "p-6 text-center text-xs text-slate-500 space-y-1" }, /* @__PURE__ */ React4.createElement(AlertCircle, { className: "w-5 h-5 text-slate-400 mx-auto" }), /* @__PURE__ */ React4.createElement("p", { className: "font-bold text-[#0F172A]" }, "No matching options found"), /* @__PURE__ */ React4.createElement("p", { className: "text-[11px]" }, "Try searching for 'Science', 'Commerce', 'Diploma', or 'ITI'"))))), /* @__PURE__ */ React4.createElement("div", { className: "flex items-center space-x-3 sm:space-x-4 shrink-0 relative", ref: dropdownRef }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsDropdownOpen(!isDropdownOpen),
      className: "flex items-center space-x-3 p-1.5 rounded-xl border border-transparent hover:bg-slate-50 transition-all cursor-pointer text-left focus:outline-none",
      title: "Student Profile Menu"
    },
    /* @__PURE__ */ React4.createElement("div", { className: "w-8 h-8 rounded-full bg-[#005F60] text-white flex items-center justify-center font-black text-xs shadow-xs" }, user?.full_name ? user.full_name.charAt(0).toUpperCase() : "S"),
    /* @__PURE__ */ React4.createElement("div", { className: "text-left hidden md:flex items-center gap-1.5" }, /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("span", { className: "text-xs font-black text-[#0F172A] block leading-tight" }, user?.full_name || "Student User"), /* @__PURE__ */ React4.createElement("span", { className: "text-[10px] text-[#005F60] font-extrabold block leading-tight" }, profile?.current_level || "Class 10", " ", profile?.stream ? `\u2022 ${profile.stream}` : "")), /* @__PURE__ */ React4.createElement("span", { className: "text-[10px] text-slate-400" }, "\u25BC"))
  ), isDropdownOpen && /* @__PURE__ */ React4.createElement("div", { className: "absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150" }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setIsDropdownOpen(false);
        if (onEditProfileClick) onEditProfileClick();
      },
      className: "w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50/70 hover:text-[#005F60] transition-colors"
    },
    "Edit Profile"
  ), /* @__PURE__ */ React4.createElement("hr", { className: "border-slate-100 my-1" }), /* @__PURE__ */ React4.createElement(
    "button",
    {
      type: "button",
      onClick: handleLogout,
      className: "w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
    },
    "Sign Out"
  ))));
};
var Header_default = Header;

// src/components/EditProfileDrawer.jsx
import React5, { useState as useState4, useEffect as useEffect4 } from "react";
import { X as X3, Save, AlertCircle as AlertCircle2, CheckCircle2, GraduationCap, ArrowRight, ShieldAlert, Sparkles as Sparkles2 } from "lucide-react";
var KARNATAKA_DISTRICTS = [
  "Bagalkot",
  "Ballari",
  "Belagavi",
  "Bengaluru Rural",
  "Bengaluru Urban",
  "Bidar",
  "Chamarajanagar",
  "Chikkamagaluru",
  "Chikkaballapur",
  "Chitradurga",
  "Dakshina Kannada",
  "Davanagere",
  "Dharwad",
  "Gadag",
  "Hassan",
  "Haveri",
  "Kalaburagi",
  "Kodagu",
  "Kolar",
  "Koppal",
  "Mandya",
  "Mysuru",
  "Raichur",
  "Ramanagara",
  "Shivamogga",
  "Tumakuru",
  "Udupi",
  "Uttara Kannada",
  "Vijayanagara",
  "Yadgir"
];
var DIPLOMA_BRANCHES = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical & Electronics Engineering",
  "Information Science & Technology",
  "Automobile Engineering",
  "Mechatronics Engineering",
  "Other Diploma Branch"
];
var ITI_TRADES = [
  "Electrician",
  "Fitter",
  "COPA (Computer Operator & Programming Assistant)",
  "Electronic Mechanic",
  "Mechanic Motor Vehicle (MMV)",
  "Welder",
  "Turner / Machinist",
  "Solar Technician",
  "Other ITI Trade"
];
var EditProfileDrawer = ({ isOpen, onClose }) => {
  const { profile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState4({
    full_name: "",
    institution_name: "",
    district: "Bengaluru Urban",
    state: "Karnataka",
    preferred_language: "English"
  });
  const [isStageModalOpen, setIsStageModalOpen] = useState4(false);
  const [stageFormData, setStageFormData] = useState4({
    current_level: "Class 10",
    class_or_year: "10th Standard",
    board: "Karnataka State Board (SSLC)",
    stream: "Science",
    diploma_branch: "Computer Science & Engineering",
    iti_trade: "Electrician"
  });
  const [loading, setLoading] = useState4(false);
  const [stageLoading, setStageLoading] = useState4(false);
  const [error, setError] = useState4(null);
  const [stageError, setStageError] = useState4(null);
  const [successMsg, setSuccessMsg] = useState4(null);
  const [stageSuccessMsg, setStageSuccessMsg] = useState4(null);
  useEffect4(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        institution_name: profile.institution_name || "",
        district: profile.district || "Bengaluru Urban",
        state: profile.state || "Karnataka",
        preferred_language: profile.preferred_language || "English"
      });
      setStageFormData({
        current_level: profile.current_level || "Class 10",
        class_or_year: profile.class_or_year || "10th Standard",
        board: profile.board || "Karnataka State Board (SSLC)",
        stream: profile.stream || "Science",
        diploma_branch: profile.diploma_branch || "Computer Science & Engineering",
        iti_trade: profile.iti_trade || "Electrician"
      });
    }
  }, [profile, isOpen]);
  if (!isOpen) return null;
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleStageLevelChange = (newLevel) => {
    let boardDefault = stageFormData.board;
    let classOrYear = stageFormData.class_or_year;
    if (newLevel === "Class 8" || newLevel === "Class 9" || newLevel === "Class 10") {
      boardDefault = "Karnataka State Board (SSLC)";
      classOrYear = `${newLevel.split(" ")[1]}th Standard`;
    } else if (newLevel.startsWith("PUC")) {
      boardDefault = "Karnataka Pre-University Education";
      classOrYear = newLevel === "PUC 1" ? "1st Year PUC" : "2nd Year PUC";
    } else if (newLevel === "Diploma") {
      boardDefault = "Directorate of Technical Education (DTE Karnataka)";
      classOrYear = "1st Year Diploma";
    } else if (newLevel === "ITI") {
      boardDefault = "Department of Employment and Training (DET Karnataka)";
      classOrYear = "1st Year ITI";
    }
    setStageFormData({
      ...stageFormData,
      current_level: newLevel,
      class_or_year: classOrYear,
      board: boardDefault
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await updateMyProfileApi({
        full_name: formData.full_name,
        institution_name: formData.institution_name,
        district: formData.district,
        state: formData.state || "Karnataka",
        preferred_language: formData.preferred_language
      });
      await refreshProfile();
      setSuccessMsg("Profile details updated successfully!");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1e3);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to update student profile");
    } finally {
      setLoading(false);
    }
  };
  const handleStageSubmit = async (e) => {
    e.preventDefault();
    setStageError(null);
    setStageSuccessMsg(null);
    setStageLoading(true);
    try {
      const payload = {
        current_level: stageFormData.current_level,
        class_or_year: stageFormData.class_or_year,
        board: stageFormData.board,
        stream: stageFormData.current_level.startsWith("PUC") ? stageFormData.stream : null,
        diploma_branch: stageFormData.current_level === "Diploma" ? stageFormData.diploma_branch : null,
        iti_trade: stageFormData.current_level === "ITI" ? stageFormData.iti_trade : null
      };
      await updateMyAcademicStageApi(payload);
      await refreshProfile();
      setStageSuccessMsg("Academic stage updated! New level assessment is now assigned.");
      setTimeout(() => {
        setStageSuccessMsg(null);
        setIsStageModalOpen(false);
      }, 1300);
    } catch (err) {
      setStageError(err.response?.data?.detail || err.message || "Failed to update academic stage");
    } finally {
      setStageLoading(false);
    }
  };
  return /* @__PURE__ */ React5.createElement("div", { className: "fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end" }, /* @__PURE__ */ React5.createElement("div", { className: "bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200" }, /* @__PURE__ */ React5.createElement("div", { className: "p-6 border-b border-slate-200 flex items-center justify-between bg-[#F8FAF8]" }, /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("h2", { className: "text-lg font-black text-[#0F172A]" }, "Student Profile"), /* @__PURE__ */ React5.createElement("p", { className: "text-xs text-slate-500" }, "Edit general details or manage education stage")), /* @__PURE__ */ React5.createElement(
    "button",
    {
      onClick: onClose,
      className: "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
    },
    /* @__PURE__ */ React5.createElement(X3, { className: "w-5 h-5" })
  )), /* @__PURE__ */ React5.createElement("form", { onSubmit: handleSubmit, className: "flex-1 overflow-y-auto p-6 space-y-4 text-xs" }, error && /* @__PURE__ */ React5.createElement("div", { className: "bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800 font-medium" }, /* @__PURE__ */ React5.createElement(AlertCircle2, { className: "w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" }), /* @__PURE__ */ React5.createElement("span", null, error)), successMsg && /* @__PURE__ */ React5.createElement("div", { className: "bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-emerald-800 font-extrabold" }, /* @__PURE__ */ React5.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-600" }), /* @__PURE__ */ React5.createElement("span", null, successMsg)), /* @__PURE__ */ React5.createElement("div", { className: "bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-200/70 rounded-2xl p-4 shadow-xs" }, /* @__PURE__ */ React5.createElement("div", { className: "flex items-center justify-between mb-2.5" }, /* @__PURE__ */ React5.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React5.createElement("div", { className: "w-7 h-7 rounded-lg bg-[#005F60] text-white flex items-center justify-center" }, /* @__PURE__ */ React5.createElement(GraduationCap, { className: "w-4 h-4" })), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("span", { className: "text-[10px] font-bold text-emerald-800 uppercase tracking-wider block" }, "Academic Status"), /* @__PURE__ */ React5.createElement("span", { className: "font-extrabold text-sm text-[#0F172A]" }, profile?.current_level || "Class 10", profile?.stream ? ` \u2022 ${profile.stream}` : "", profile?.diploma_branch ? ` \u2022 ${profile.diploma_branch}` : "", profile?.iti_trade ? ` \u2022 ${profile.iti_trade}` : "")))), /* @__PURE__ */ React5.createElement("div", { className: "text-[11px] text-slate-600 space-y-1 mb-3 pt-1 border-t border-emerald-200/50" }, /* @__PURE__ */ React5.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React5.createElement("span", { className: "text-slate-500" }, "Board:"), /* @__PURE__ */ React5.createElement("span", { className: "font-semibold text-slate-700" }, profile?.board || "Karnataka State Board (SSLC)")), /* @__PURE__ */ React5.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React5.createElement("span", { className: "text-slate-500" }, "Year / Class:"), /* @__PURE__ */ React5.createElement("span", { className: "font-semibold text-slate-700" }, profile?.class_or_year || "10th Standard"))), /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsStageModalOpen(true),
      className: "w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-100/50 transition-colors shadow-2xs cursor-pointer"
    },
    /* @__PURE__ */ React5.createElement("span", null, "Update Education Stage"),
    /* @__PURE__ */ React5.createElement(ArrowRight, { className: "w-3.5 h-3.5" })
  )), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "Full Name"), /* @__PURE__ */ React5.createElement(
    "input",
    {
      type: "text",
      name: "full_name",
      required: true,
      value: formData.full_name,
      onChange: handleChange,
      placeholder: "e.g. Student Name",
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    }
  )), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "School / College Name"), /* @__PURE__ */ React5.createElement(
    "input",
    {
      type: "text",
      name: "institution_name",
      required: true,
      value: formData.institution_name,
      onChange: handleChange,
      placeholder: "e.g. Government PU College / High School",
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    }
  )), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "District (Karnataka)"), /* @__PURE__ */ React5.createElement(
    "select",
    {
      name: "district",
      value: formData.district,
      onChange: handleChange,
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    },
    KARNATAKA_DISTRICTS.map((d) => /* @__PURE__ */ React5.createElement("option", { key: d, value: d }, d))
  )), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "State"), /* @__PURE__ */ React5.createElement(
    "input",
    {
      type: "text",
      name: "state",
      disabled: true,
      value: formData.state,
      className: "w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
    }
  )), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "Preferred Language"), /* @__PURE__ */ React5.createElement(
    "select",
    {
      name: "preferred_language",
      value: formData.preferred_language,
      onChange: handleChange,
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    },
    /* @__PURE__ */ React5.createElement("option", { value: "English" }, "English"),
    /* @__PURE__ */ React5.createElement("option", { value: "Kannada" }, "Kannada"),
    /* @__PURE__ */ React5.createElement("option", { value: "Hindi" }, "Hindi")
  ))), /* @__PURE__ */ React5.createElement("div", { className: "p-6 border-t border-slate-200 bg-[#F8FAF8] flex items-center justify-end space-x-3" }, /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors cursor-pointer text-xs"
    },
    "Cancel"
  ), /* @__PURE__ */ React5.createElement(
    "button",
    {
      onClick: handleSubmit,
      disabled: loading,
      className: "px-5 py-2 rounded-xl bg-[#005F60] text-white font-extrabold hover:bg-[#004D40] transition-colors flex items-center space-x-2 shadow-sm cursor-pointer text-xs disabled:opacity-50"
    },
    /* @__PURE__ */ React5.createElement(Save, { className: "w-4 h-4" }),
    /* @__PURE__ */ React5.createElement("span", null, loading ? "Saving..." : "Save Profile")
  ))), isStageModalOpen && /* @__PURE__ */ React5.createElement("div", { className: "fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" }, /* @__PURE__ */ React5.createElement("div", { className: "bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150" }, /* @__PURE__ */ React5.createElement("div", { className: "p-6 border-b border-slate-100 bg-[#F8FAF8] flex items-center justify-between" }, /* @__PURE__ */ React5.createElement("div", { className: "flex items-center space-x-3" }, /* @__PURE__ */ React5.createElement("div", { className: "w-10 h-10 rounded-xl bg-[#005F60] text-white flex items-center justify-center" }, /* @__PURE__ */ React5.createElement(GraduationCap, { className: "w-5 h-5" })), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("h3", { className: "font-extrabold text-base text-[#0F172A]" }, "Update Education Stage"), /* @__PURE__ */ React5.createElement("p", { className: "text-xs text-slate-500" }, "Transitions your academic decision stage safely"))), /* @__PURE__ */ React5.createElement(
    "button",
    {
      onClick: () => setIsStageModalOpen(false),
      className: "p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
    },
    /* @__PURE__ */ React5.createElement(X3, { className: "w-5 h-5" })
  )), /* @__PURE__ */ React5.createElement("form", { onSubmit: handleStageSubmit, className: "p-6 space-y-4 text-xs" }, /* @__PURE__ */ React5.createElement("div", { className: "bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start space-x-2.5 text-amber-900" }, /* @__PURE__ */ React5.createElement(Sparkles2, { className: "w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" }), /* @__PURE__ */ React5.createElement("div", { className: "text-[11px] leading-relaxed" }, /* @__PURE__ */ React5.createElement("span", { className: "font-bold block" }, "Academic Safety Policy"), "Updating your education stage assigns the appropriate career discovery assessment for your level. Your historical assessments, recommendations, and active goals will remain safe in your profile.")), stageError && /* @__PURE__ */ React5.createElement("div", { className: "bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800 font-medium" }, /* @__PURE__ */ React5.createElement(AlertCircle2, { className: "w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" }), /* @__PURE__ */ React5.createElement("span", null, stageError)), stageSuccessMsg && /* @__PURE__ */ React5.createElement("div", { className: "bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-emerald-800 font-extrabold" }, /* @__PURE__ */ React5.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-600" }), /* @__PURE__ */ React5.createElement("span", null, stageSuccessMsg)), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "New Education Level *"), /* @__PURE__ */ React5.createElement(
    "select",
    {
      value: stageFormData.current_level,
      onChange: (e) => handleStageLevelChange(e.target.value),
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    },
    /* @__PURE__ */ React5.createElement("option", { value: "Class 8" }, "Class 8 (Middle School)"),
    /* @__PURE__ */ React5.createElement("option", { value: "Class 9" }, "Class 9 (High School)"),
    /* @__PURE__ */ React5.createElement("option", { value: "Class 10" }, "Class 10 (SSLC)"),
    /* @__PURE__ */ React5.createElement("option", { value: "PUC 1" }, "PUC 1 (1st Year Pre-University)"),
    /* @__PURE__ */ React5.createElement("option", { value: "PUC 2" }, "PUC 2 (2nd Year Pre-University)"),
    /* @__PURE__ */ React5.createElement("option", { value: "Diploma" }, "Polytechnic Diploma"),
    /* @__PURE__ */ React5.createElement("option", { value: "ITI" }, "ITI Vocational Trades")
  )), stageFormData.current_level.startsWith("PUC") && /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "PUC Academic Stream *"), /* @__PURE__ */ React5.createElement(
    "select",
    {
      value: stageFormData.stream,
      onChange: (e) => setStageFormData({ ...stageFormData, stream: e.target.value }),
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    },
    /* @__PURE__ */ React5.createElement("option", { value: "Science" }, "Science (PCMB / PCMC / PCME)"),
    /* @__PURE__ */ React5.createElement("option", { value: "Commerce" }, "Commerce (CEBA / SEBA)"),
    /* @__PURE__ */ React5.createElement("option", { value: "Arts" }, "Arts / Humanities (HEPS / EGAS)")
  )), stageFormData.current_level === "Diploma" && /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "Diploma Branch *"), /* @__PURE__ */ React5.createElement(
    "select",
    {
      value: stageFormData.diploma_branch,
      onChange: (e) => setStageFormData({ ...stageFormData, diploma_branch: e.target.value }),
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    },
    DIPLOMA_BRANCHES.map((b) => /* @__PURE__ */ React5.createElement("option", { key: b, value: b }, b))
  )), stageFormData.current_level === "ITI" && /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "ITI Trade *"), /* @__PURE__ */ React5.createElement(
    "select",
    {
      value: stageFormData.iti_trade,
      onChange: (e) => setStageFormData({ ...stageFormData, iti_trade: e.target.value }),
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    },
    ITI_TRADES.map((t) => /* @__PURE__ */ React5.createElement("option", { key: t, value: t }, t))
  )), /* @__PURE__ */ React5.createElement("div", null, /* @__PURE__ */ React5.createElement("label", { className: "block font-bold text-[#0F172A] mb-1" }, "Board / Department Authority"), /* @__PURE__ */ React5.createElement(
    "input",
    {
      type: "text",
      value: stageFormData.board,
      onChange: (e) => setStageFormData({ ...stageFormData, board: e.target.value }),
      className: "w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
    }
  )), /* @__PURE__ */ React5.createElement("div", { className: "pt-4 flex items-center justify-end space-x-3 border-t border-slate-100" }, /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsStageModalOpen(false),
      className: "px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
    },
    "Cancel"
  ), /* @__PURE__ */ React5.createElement(
    "button",
    {
      type: "submit",
      disabled: stageLoading,
      className: "px-5 py-2 rounded-xl bg-[#005F60] text-white font-extrabold hover:bg-[#004D40] transition-colors flex items-center space-x-2 shadow-sm cursor-pointer text-xs disabled:opacity-50"
    },
    /* @__PURE__ */ React5.createElement(GraduationCap, { className: "w-4 h-4" }),
    /* @__PURE__ */ React5.createElement("span", null, stageLoading ? "Updating Stage..." : "Confirm Stage Change")
  ))))));
};
var EditProfileDrawer_default = EditProfileDrawer;

// src/components/product/EducationPathwayMap.jsx
import React6, { useState as useState5, useRef as useRef2 } from "react";
import {
  Compass as Compass2,
  ZoomIn,
  ZoomOut
} from "lucide-react";
var PATHWAY_ID_TO_NODE_MAP = {
  "c10-puc": "puc",
  "c10-diploma": "diploma",
  "c10-iti": "iti",
  "puc-science": "puc-science",
  "puc-commerce": "puc-commerce",
  "puc-arts": "puc-arts",
  "puc-science-pcmb": "puc-science",
  "puc-science-pcmc": "puc-science",
  "puc-science-pcme": "puc-science",
  "puc-commerce-fin": "puc-commerce",
  "puc-arts-hum": "puc-arts",
  "dip-family-comp": "dip-family-comp",
  "dip-family-elec": "dip-family-elec",
  "dip-family-mech": "dip-family-mech",
  "dip-family-civil": "dip-family-civil",
  "iti-family-elec": "iti-family-elec",
  "iti-family-mech": "iti-family-mech",
  "iti-family-comp": "iti-family-comp",
  // Choice direction pathways map to their structural stream parent
  "puc-science-med": "puc-science",
  "puc-science-ayush": "puc-science",
  "puc-science-pure": "puc-science",
  "puc-science-allied": "puc-science",
  "puc-science-pharm": "puc-science",
  "puc-science-agri": "puc-science",
  "puc-science-vet": "puc-science",
  "puc-science-eng": "puc-science",
  "puc-science-comp": "puc-science",
  "puc-science-arch": "puc-science",
  "puc-science-cse-careers": "puc-science",
  "puc-commerce-ca": "puc-commerce",
  "puc-arts-media": "puc-arts",
  "puc-arts-bsw": "puc-arts",
  "puc-arts-edu": "puc-arts",
  "cross-law": "puc-arts",
  "cross-design": "puc-arts",
  "cross-hospitality": "puc-commerce"
};
var getVisualNodeId = (pathwayId) => {
  if (!pathwayId) return "c10";
  return PATHWAY_ID_TO_NODE_MAP[pathwayId] || pathwayId;
};
var STRUCTURAL_NODES = {
  // Column 0: Foundation
  "c10": {
    id: "c10",
    label: "Class 10 / SSLC",
    subLabel: "Secondary Completion",
    col: 0,
    row: 2.2,
    type: "root",
    color: "#005F60",
    pathwayId: null
  },
  // Column 1: Main Routes
  "puc": {
    id: "puc",
    label: "PUC (11th & 12th)",
    subLabel: "Pre-University Academic",
    parentId: "c10",
    col: 1,
    row: 1,
    type: "route",
    color: "#005F60",
    pathwayId: "c10-puc"
  },
  "diploma": {
    id: "diploma",
    label: "Polytechnic Diploma",
    subLabel: "3-Year Technical DTE",
    parentId: "c10",
    col: 1,
    row: 2.5,
    type: "route",
    color: "#0EA5E9",
    pathwayId: "c10-diploma"
  },
  "iti": {
    id: "iti",
    label: "ITI Vocational Trades",
    subLabel: "1-2 Year Vocational Skills",
    parentId: "c10",
    col: 1,
    row: 3.8,
    type: "route",
    color: "#F59E0B",
    pathwayId: "c10-iti"
  },
  // Column 2: Streams & Discipline Families (Graph Endpoints)
  "puc-science": {
    id: "puc-science",
    label: "Science Stream",
    subLabel: "STEM Foundations",
    parentId: "puc",
    col: 2,
    row: 0.6,
    type: "stream",
    color: "#005F60",
    pathwayId: "puc-science"
  },
  "puc-commerce": {
    id: "puc-commerce",
    label: "Commerce Stream",
    subLabel: "Business & Finance",
    parentId: "puc",
    col: 2,
    row: 1.2,
    type: "stream",
    color: "#005F60",
    pathwayId: "puc-commerce"
  },
  "puc-arts": {
    id: "puc-arts",
    label: "Arts & Humanities",
    subLabel: "Social Sciences & Law",
    parentId: "puc",
    col: 2,
    row: 1.8,
    type: "stream",
    color: "#005F60",
    pathwayId: "puc-arts"
  },
  "dip-family-comp": {
    id: "dip-family-comp",
    label: "Computing & Digital",
    subLabel: "Software & Networks",
    parentId: "diploma",
    col: 2,
    row: 2.2,
    type: "family",
    color: "#0EA5E9",
    pathwayId: "dip-family-comp"
  },
  "dip-family-elec": {
    id: "dip-family-elec",
    label: "Electrical & Electronics",
    subLabel: "IoT & Power Grid",
    parentId: "diploma",
    col: 2,
    row: 2.7,
    type: "family",
    color: "#0EA5E9",
    pathwayId: "dip-family-elec"
  },
  "dip-family-mech": {
    id: "dip-family-mech",
    label: "Mechanical & Auto",
    subLabel: "CAD & Robotics",
    parentId: "diploma",
    col: 2,
    row: 3.2,
    type: "family",
    color: "#0EA5E9",
    pathwayId: "dip-family-mech"
  },
  "dip-family-civil": {
    id: "dip-family-civil",
    label: "Civil & Infrastructure",
    subLabel: "Surveying & Structural",
    parentId: "diploma",
    col: 2,
    row: 3.7,
    type: "family",
    color: "#0EA5E9",
    pathwayId: "dip-family-civil"
  },
  "iti-family-elec": {
    id: "iti-family-elec",
    label: "Electrical ITI Trades",
    subLabel: "Wiring & Motors",
    parentId: "iti",
    col: 2,
    row: 4.1,
    type: "family",
    color: "#F59E0B",
    pathwayId: "iti-family-elec"
  },
  "iti-family-mech": {
    id: "iti-family-mech",
    label: "Mechanical & Fitter",
    subLabel: "Lathe & Fabrication",
    parentId: "iti",
    col: 2,
    row: 4.6,
    type: "family",
    color: "#F59E0B",
    pathwayId: "iti-family-mech"
  },
  "iti-family-comp": {
    id: "iti-family-comp",
    label: "COPA & Office ITI",
    subLabel: "Digital Operations",
    parentId: "iti",
    col: 2,
    row: 5.1,
    type: "family",
    color: "#F59E0B",
    pathwayId: "iti-family-comp"
  }
};
var EducationPathwayMap = ({
  selectedNodeId = "puc-science",
  onSelectNode,
  studentProfile,
  recommendations
}) => {
  const [zoomLevel, setZoomLevel] = useState5(1);
  const [pan, setPan] = useState5({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState5(false);
  const [dragStart, setDragStart] = useState5({ x: 0, y: 0 });
  const containerRef = useRef2(null);
  const width = 820;
  const height = 400;
  const colWidth = 270;
  const rowHeight = 68;
  const startX = 60;
  const startY = 28;
  const getNodePos = (node) => {
    return {
      x: startX + node.col * colWidth,
      y: startY + node.row * rowHeight
    };
  };
  const activeTrailSet = /* @__PURE__ */ new Set();
  let curr = STRUCTURAL_NODES[selectedNodeId] || STRUCTURAL_NODES[getVisualNodeId(selectedNodeId)];
  while (curr) {
    activeTrailSet.add(curr.id);
    curr = STRUCTURAL_NODES[curr.parentId];
  }
  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(0.8, prev + delta), 1.3));
  };
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  return /* @__PURE__ */ React6.createElement("div", { className: "bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs flex flex-col space-y-2.5 font-sans select-none" }, /* @__PURE__ */ React6.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5" }, /* @__PURE__ */ React6.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React6.createElement("div", { className: "w-7 h-7 rounded-xl bg-teal-50 text-[#005F60] border border-teal-200/80 flex items-center justify-center font-black" }, /* @__PURE__ */ React6.createElement(Compass2, { className: "w-4 h-4" })), /* @__PURE__ */ React6.createElement("div", null, /* @__PURE__ */ React6.createElement("h3", { className: "font-black text-xs sm:text-sm text-slate-900 leading-none" }, "Structural Education Map"), /* @__PURE__ */ React6.createElement("span", { className: "text-[10px] text-slate-500 font-semibold" }, "Click a stream or family to explore choices below"))), /* @__PURE__ */ React6.createElement("div", { className: "flex items-center space-x-1.5" }, /* @__PURE__ */ React6.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleZoom(0.1),
      className: "w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer",
      title: "Zoom In"
    },
    /* @__PURE__ */ React6.createElement(ZoomIn, { className: "w-3.5 h-3.5" })
  ), /* @__PURE__ */ React6.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleZoom(-0.1),
      className: "w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer",
      title: "Zoom Out"
    },
    /* @__PURE__ */ React6.createElement(ZoomOut, { className: "w-3.5 h-3.5" })
  ))), /* @__PURE__ */ React6.createElement(
    "div",
    {
      ref: containerRef,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      className: "relative bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing h-[340px] flex items-center justify-center"
    },
    /* @__PURE__ */ React6.createElement(
      "svg",
      {
        viewBox: `0 0 ${width} ${height}`,
        className: "w-full h-full transition-transform duration-100 ease-out",
        style: {
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
          transformOrigin: "center center"
        }
      },
      /* @__PURE__ */ React6.createElement("text", { x: startX + 0 * colWidth, y: 18, className: "text-[10px] font-black fill-slate-400 uppercase tracking-wider text-anchor-start" }, "STAGE 0 \u2022 FOUNDATION"),
      /* @__PURE__ */ React6.createElement("text", { x: startX + 1 * colWidth, y: 18, className: "text-[10px] font-black fill-slate-400 uppercase tracking-wider text-anchor-start" }, "STAGE 1 \u2022 MAIN ROUTES"),
      /* @__PURE__ */ React6.createElement("text", { x: startX + 2 * colWidth, y: 18, className: "text-[10px] font-black fill-slate-400 uppercase tracking-wider text-anchor-start" }, "STAGE 2 \u2022 STREAMS & FAMILIES"),
      /* @__PURE__ */ React6.createElement("g", { className: "connectors" }, Object.values(STRUCTURAL_NODES).map((node) => {
        if (!node.parentId) return null;
        const parent = STRUCTURAL_NODES[node.parentId];
        if (!parent) return null;
        const posFrom = getNodePos(parent);
        const posTo = getNodePos(node);
        const isTrailActive = activeTrailSet.has(node.id) && activeTrailSet.has(parent.id);
        const dx = (posTo.x - posFrom.x) * 0.5;
        const pathD = `M ${posFrom.x + 95} ${posFrom.y} C ${posFrom.x + 95 + dx} ${posFrom.y}, ${posTo.x - dx} ${posTo.y}, ${posTo.x - 10} ${posTo.y}`;
        return /* @__PURE__ */ React6.createElement(
          "path",
          {
            key: `line-${parent.id}-${node.id}`,
            d: pathD,
            fill: "none",
            stroke: isTrailActive ? "#005F60" : "#CBD5E1",
            strokeWidth: isTrailActive ? 3.2 : 1.6,
            strokeDasharray: isTrailActive ? "none" : "4 4",
            className: "transition-all duration-300"
          }
        );
      })),
      /* @__PURE__ */ React6.createElement("g", { className: "nodes" }, Object.values(STRUCTURAL_NODES).map((node) => {
        const pos = getNodePos(node);
        const visualSelected = getVisualNodeId(selectedNodeId);
        const isSelected = visualSelected === node.id;
        const isInTrail = activeTrailSet.has(node.id);
        return /* @__PURE__ */ React6.createElement(
          "g",
          {
            key: node.id,
            transform: `translate(${pos.x}, ${pos.y})`,
            tabIndex: 0,
            role: "button",
            "aria-label": `Explore ${node.label}`,
            onClick: (e) => {
              e.stopPropagation();
              if (onSelectNode) onSelectNode(node.id);
            },
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (onSelectNode) onSelectNode(node.id);
              }
            },
            className: "cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-[#005F60] focus-visible:ring-offset-2 rounded-xl"
          },
          isSelected && /* @__PURE__ */ React6.createElement(
            "rect",
            {
              x: "-6",
              y: "-20",
              width: "192",
              height: "40",
              rx: "14",
              fill: "#005F60",
              fillOpacity: "0.12",
              stroke: "#005F60",
              strokeWidth: "2"
            }
          ),
          /* @__PURE__ */ React6.createElement(
            "rect",
            {
              x: "0",
              y: "-16",
              width: "180",
              height: "32",
              rx: "10",
              fill: isSelected ? "#005F60" : isInTrail ? "#F8FAF8" : "#FFFFFF",
              stroke: isSelected ? "#005F60" : isInTrail ? "#005F60" : "#E2E8F0",
              strokeWidth: isSelected || isInTrail ? 2 : 1,
              className: "transition-all duration-200 shadow-2xs group-hover:stroke-[#005F60] group-hover:shadow-xs"
            }
          ),
          /* @__PURE__ */ React6.createElement(
            "circle",
            {
              cx: "16",
              cy: "0",
              r: "8",
              fill: isSelected ? "#FFFFFF" : node.color
            }
          ),
          /* @__PURE__ */ React6.createElement(
            "circle",
            {
              cx: "16",
              cy: "0",
              r: "3.5",
              fill: isSelected ? "#005F60" : "#FFFFFF"
            }
          ),
          /* @__PURE__ */ React6.createElement(
            "text",
            {
              x: "30",
              y: "-2",
              className: `text-[10.5px] font-black transition-colors ${isSelected ? "fill-white" : "fill-slate-900 group-hover:fill-[#005F60]"}`
            },
            node.label
          ),
          /* @__PURE__ */ React6.createElement(
            "text",
            {
              x: "30",
              y: "9",
              className: `text-[8.5px] font-extrabold ${isSelected ? "fill-teal-100" : "fill-slate-400"}`
            },
            node.subLabel
          )
        );
      }))
    )
  ));
};
var EducationPathwayMap_default = EducationPathwayMap;

// src/components/product/PathwayChoiceExplorer.jsx
import React7 from "react";
import {
  Sparkles as Sparkles4,
  ArrowRight as ArrowRight2,
  Award,
  Layers as Layers2,
  BookOpen as BookOpen2
} from "lucide-react";

// src/utils/pathwayAdapter.js
import {
  Stethoscope,
  Sparkles as Sparkles3,
  BookOpen,
  Briefcase,
  ShieldCheck,
  Wrench,
  Code,
  GraduationCap as GraduationCap2,
  Layers,
  Building,
  Scale,
  Palette,
  Coffee,
  HeartHandshake
} from "lucide-react";
var CANONICAL_PATHWAY_MAP = {
  "c10": null,
  // Structural only, no backend pathway
  "puc": "c10-puc",
  "diploma": "c10-diploma",
  "iti": "c10-iti"
};
var getCanonicalPathwayId = (id) => {
  if (id === "c10") return null;
  if (CANONICAL_PATHWAY_MAP[id] !== void 0) {
    return CANONICAL_PATHWAY_MAP[id];
  }
  return id;
};
var STRUCTURAL_HIERARCHY = {
  "c10-puc": { label: "Class 10 / SSLC", stage: "SSLC", parent: null },
  "c10-diploma": { label: "Class 10 / SSLC", stage: "SSLC", parent: null },
  "c10-iti": { label: "Class 10 / SSLC", stage: "SSLC", parent: null },
  "puc-science": { label: "PUC (11th & 12th)", stage: "Pre-University", parent: "c10-puc" },
  "puc-commerce": { label: "PUC (11th & 12th)", stage: "Pre-University", parent: "c10-puc" },
  "puc-arts": { label: "PUC (11th & 12th)", stage: "Pre-University", parent: "c10-puc" },
  "puc-science-pcmb": { label: "Science Stream", stage: "PUC Combination", parent: "puc-science" },
  "puc-science-pcmc": { label: "Science Stream", stage: "PUC Combination", parent: "puc-science" },
  "puc-science-pcme": { label: "Science Stream", stage: "PUC Combination", parent: "puc-science" },
  "puc-commerce-fin": { label: "Commerce Stream", stage: "PUC Combination", parent: "puc-commerce" },
  "puc-arts-hum": { label: "Arts & Humanities Stream", stage: "PUC Combination", parent: "puc-arts" },
  "dip-family-comp": { label: "Polytechnic Diploma", stage: "Diploma Family", parent: "c10-diploma" },
  "dip-family-elec": { label: "Polytechnic Diploma", stage: "Diploma Family", parent: "c10-diploma" },
  "dip-family-mech": { label: "Polytechnic Diploma", stage: "Diploma Family", parent: "c10-diploma" },
  "dip-family-civil": { label: "Polytechnic Diploma", stage: "Diploma Family", parent: "c10-diploma" },
  "iti-family-elec": { label: "ITI Vocational Trades", stage: "ITI Family", parent: "c10-iti" },
  "iti-family-mech": { label: "ITI Vocational Trades", stage: "ITI Family", parent: "c10-iti" },
  "iti-family-comp": { label: "ITI Vocational Trades", stage: "ITI Family", parent: "c10-iti" }
};
var STREAM_COMBINATIONS_MAPPING = {
  "puc-science": ["puc-science-pcmb", "puc-science-pcmc", "puc-science-pcme"],
  "puc-commerce": ["puc-commerce-fin"],
  "puc-arts": ["puc-arts-hum"],
  "dip-family-comp": ["dip-family-comp"],
  "dip-family-elec": ["dip-family-elec"],
  "dip-family-mech": ["dip-family-mech"],
  "dip-family-civil": ["dip-family-civil"],
  "iti-family-elec": ["iti-family-elec"],
  "iti-family-mech": ["iti-family-mech"],
  "iti-family-comp": ["iti-family-comp"]
};
var BRANCH_CHOICE_MAPPING = {
  "puc-science-pcmb": [
    "puc-science-med",
    "puc-science-ayush",
    "puc-science-pure",
    "puc-science-allied",
    "puc-science-pharm",
    "puc-science-agri",
    "puc-science-vet",
    "cross-law",
    "cross-design"
  ],
  "puc-science-pcmc": [
    "puc-science-eng",
    "puc-science-comp",
    "puc-science-arch",
    "puc-science-cse-careers",
    "cross-law",
    "cross-design"
  ],
  "puc-science-pcme": [
    "puc-science-eng",
    "puc-science-comp",
    "cross-design"
  ],
  "puc-commerce-fin": [
    "puc-commerce-fin",
    "puc-commerce-ca",
    "cross-law",
    "cross-design",
    "cross-hospitality"
  ],
  "puc-arts-hum": [
    "puc-arts-hum",
    "puc-arts-media",
    "puc-arts-bsw",
    "puc-arts-edu",
    "cross-law",
    "cross-design",
    "cross-hospitality"
  ],
  "dip-family-comp": ["dip-family-comp"],
  "dip-family-elec": ["dip-family-elec"],
  "dip-family-mech": ["dip-family-mech"],
  "dip-family-civil": ["dip-family-civil"],
  "iti-family-elec": ["iti-family-elec"],
  "iti-family-mech": ["iti-family-mech"],
  "iti-family-comp": ["iti-family-comp"]
};
var PRESENTATION_METADATA = {
  "puc-science-pcmb": {
    icon: Stethoscope,
    shortTag: "Biology & Math Combination",
    entranceBadge: "NEET / KCET / Agri / Pharma",
    searchAliases: ["PCMB", "PCB", "Medical Stream", "Biology Stream", "NEET Prep"]
  },
  "puc-science-pcmc": {
    icon: Code,
    shortTag: "Computer Science Combination",
    entranceBadge: "KCET / COMEDK / JEE Main",
    searchAliases: ["PCMC", "Computer Stream", "Software Stream", "BCA Prep"]
  },
  "puc-science-pcme": {
    icon: Wrench,
    shortTag: "Electronics Combination",
    entranceBadge: "KCET / COMEDK Engineering",
    searchAliases: ["PCME", "Electronics Combination"]
  },
  "puc-commerce-fin": {
    icon: Briefcase,
    shortTag: "Commerce & Finance Track",
    entranceBadge: "2nd PUC Board / ICAI Foundation",
    searchAliases: ["Commerce", "CEBA", "SEBA", "Finance", "Accounting", "B.Com"]
  },
  "puc-arts-hum": {
    icon: BookOpen,
    shortTag: "Humanities & Social Sciences",
    entranceBadge: "2nd PUC Arts Board / KSLU / NID",
    searchAliases: ["Arts", "Humanities", "HEPS", "Journalism", "Social Work"]
  },
  "puc-science-med": {
    icon: Stethoscope,
    shortTag: "Clinical Practice",
    entranceBadge: "NEET-UG Required",
    searchAliases: ["MBBS", "BDS", "Doctor", "Dentist", "Clinical", "Medicine", "NEET", "Medical"]
  },
  "puc-science-ayush": {
    icon: Sparkles3,
    shortTag: "Indian Medicine Systems",
    entranceBadge: "NEET / KEA AYUSH",
    searchAliases: ["BAMS", "BHMS", "BNYS", "Ayurveda", "Homeopathy", "Naturopathy", "AYUSH"]
  },
  "puc-science-pure": {
    icon: BookOpen,
    shortTag: "Pure & Research Sciences",
    entranceBadge: "2nd PUC Science Merit",
    searchAliases: ["B.Sc", "Physics", "Chemistry", "Biology", "Mathematics", "Biotech", "Research"]
  },
  "puc-science-allied": {
    icon: ShieldCheck,
    shortTag: "Healthcare Operations",
    entranceBadge: "KEA Allied Health / Merit",
    searchAliases: ["Nursing", "BPT", "Physiotherapy", "Lab Tech", "MLT", "Radiology", "Optometry"]
  },
  "puc-science-pharm": {
    icon: Stethoscope,
    shortTag: "Pharma & Manufacturing",
    entranceBadge: "KCET Rank / 2nd PUC",
    searchAliases: ["B.Pharm", "D.Pharm", "Pharmacy", "Pharmacist", "Drug Design"]
  },
  "puc-science-agri": {
    icon: Layers,
    shortTag: "Agricultural Innovation",
    entranceBadge: "KCET Agri Practical Rank",
    searchAliases: ["Agriculture", "Horticulture", "Forestry", "Agri Tech", "Food Tech", "Agribusiness"]
  },
  "puc-science-vet": {
    icon: ShieldCheck,
    shortTag: "Animal Healthcare",
    entranceBadge: "KCET Vet Counseling",
    searchAliases: ["B.V.Sc", "Veterinary", "Animal Husbandry", "Vet Doctor"]
  },
  "puc-science-eng": {
    icon: Wrench,
    shortTag: "Engineering & Tech",
    entranceBadge: "KCET / COMEDK / JEE",
    searchAliases: ["B.E", "B.Tech", "Engineering", "Mechanical", "Electronics", "Civil", "KCET", "COMEDK"]
  },
  "puc-science-comp": {
    icon: Code,
    shortTag: "Software & Computing",
    entranceBadge: "Direct Merit / Entrance",
    searchAliases: ["BCA", "B.Sc CS", "Computer Applications", "Software", "Coding", "IT", "Web Dev"]
  },
  "puc-science-arch": {
    icon: Building,
    shortTag: "Spatial Design & Building",
    entranceBadge: "NATA Entrance Required",
    searchAliases: ["B.Arch", "Architecture", "NATA", "Building Design", "Cad"]
  },
  "puc-science-cse-careers": {
    icon: Code,
    shortTag: "Advanced AI & Data",
    entranceBadge: "KCET / B.E Allotment",
    searchAliases: ["CSE", "AI", "Artificial Intelligence", "Data Science", "Machine Learning", "Cloud"]
  },
  "puc-commerce-ca": {
    icon: GraduationCap2,
    shortTag: "Statutory Audit & Tax",
    entranceBadge: "ICAI / ICSI Foundation",
    searchAliases: ["CA", "Chartered Accountant", "CS", "Company Secretary", "CMA", "Audit", "Taxation"]
  },
  "puc-arts-media": {
    icon: Sparkles3,
    shortTag: "Journalism & Media",
    entranceBadge: "University Portfolio / Merit",
    searchAliases: ["Journalism", "Media", "Mass Communication", "Broadcasting", "Digital Content"]
  },
  "puc-arts-bsw": {
    icon: HeartHandshake,
    shortTag: "Social Work & Policy",
    entranceBadge: "2nd PUC Merit",
    searchAliases: ["BSW", "Social Work", "Public Policy", "NGO", "Community Service"]
  },
  "puc-arts-edu": {
    icon: GraduationCap2,
    shortTag: "Teaching & Pedagogy",
    entranceBadge: "Degree + B.Ed + K-TET",
    searchAliases: ["B.Ed", "Teaching", "Teacher", "K-TET", "C-TET", "Education"]
  },
  "dip-family-comp": {
    icon: Code,
    shortTag: "Technical Diploma (CS)",
    entranceBadge: "DTE Merit Allotment / DCET",
    searchAliases: ["Diploma CS", "Computer Diploma", "DCET", "Polytechnic CS"]
  },
  "dip-family-elec": {
    icon: Wrench,
    shortTag: "Technical Diploma (Elec)",
    entranceBadge: "DTE Merit Allotment / DCET",
    searchAliases: ["Diploma Electrical", "ECE Diploma", "EEE Diploma", "DCET"]
  },
  "dip-family-mech": {
    icon: Wrench,
    shortTag: "Technical Diploma (Mech)",
    entranceBadge: "DTE Merit Allotment / DCET",
    searchAliases: ["Diploma Mechanical", "Automobile Diploma", "DCET", "ME-DIP"]
  },
  "dip-family-civil": {
    icon: Building,
    shortTag: "Technical Diploma (Civil)",
    entranceBadge: "DTE Merit Allotment / DCET",
    searchAliases: ["Diploma Civil", "Building Diploma", "Surveying"]
  },
  "iti-family-elec": {
    icon: Wrench,
    shortTag: "Vocational Trade Certificate",
    entranceBadge: "DET ITI Counseling / AITT",
    searchAliases: ["Electrician", "ITI Electrician", "AITT", "NTC", "Trade"]
  },
  "iti-family-mech": {
    icon: Wrench,
    shortTag: "Vocational Trade Certificate",
    entranceBadge: "DET ITI Counseling / AITT",
    searchAliases: ["Fitter", "Turner", "Welder", "ITI Fitter", "Apprenticeship"]
  },
  "iti-family-comp": {
    icon: Code,
    shortTag: "Vocational Trade Certificate",
    entranceBadge: "DET ITI Counseling / AITT",
    searchAliases: ["COPA", "ITI COPA", "Computer Operator"]
  },
  "cross-law": {
    icon: Scale,
    shortTag: "Legal Practice & Advocacy",
    entranceBadge: "CLAT / LSAT / KSLU Allotment",
    searchAliases: ["Law", "LLB", "BA LLB", "Advocate", "Legal", "CLAT", "Court"]
  },
  "cross-design": {
    icon: Palette,
    shortTag: "Creative Design & Visual Arts",
    entranceBadge: "NID / UCEED / Portfolio",
    searchAliases: ["Design", "B.Des", "NID", "UCEED", "Fine Arts", "UX Design", "Graphics"]
  },
  "cross-hospitality": {
    icon: Coffee,
    shortTag: "Hotel & Resort Management",
    entranceBadge: "NCHMCT JEE / Direct Allotment",
    searchAliases: ["Hospitality", "Hotel Management", "BHM", "Tourism", "Catering"]
  }
};
var C10_STRUCTURAL_DETAIL = {
  id: "c10",
  isStructuralOnly: true,
  category: "STAGE 0 \u2022 FOUNDATION",
  title: "Class 10 / SSLC (Secondary Education)",
  description: "Secondary School Leaving Certificate (SSLC / Class 10) is the foundational stage for high school students in Karnataka. From here, students can choose to explore 2-Year Pre-University Courses (PUC Academic), 3-Year Polytechnic Engineering Diplomas (DTE Technical), or 1-2 Year ITI Vocational Trades (DET Skill Certification).",
  duration: "10th Foundation",
  options: [
    {
      id: "opt-puc-overview",
      option_name: "2-Year Pre-University Course (PUC)",
      stream_or_code: "PUC Academic",
      description: "Academic pre-university stream under Karnataka DPUE board. Primary route to university degrees in Science, Commerce, and Arts.",
      eligibility: "Class 10 / SSLC Pass"
    },
    {
      id: "opt-diploma-overview",
      option_name: "3-Year Polytechnic Diploma (DTE)",
      stream_or_code: "Polytechnic",
      description: "Practical technical engineering diploma under Directorate of Technical Education Karnataka. Enables direct 2nd-year B.E lateral entry via DCET.",
      eligibility: "Class 10 Pass with Min 35% in Science & Math"
    },
    {
      id: "opt-iti-overview",
      option_name: "1-2 Year ITI Vocational Trades (DET)",
      stream_or_code: "Vocational ITI",
      description: "Job-ready vocational trade training under Department of Employment & Training Karnataka. Leads to NTC certification and apprenticeships.",
      eligibility: "Class 10 / SSLC Pass"
    }
  ],
  milestones: [
    {
      id: "ms-c10-1",
      step_number: 1,
      title: "Complete Class 10 / SSLC Examination",
      description: "Pass the 10th standard board exams conducted by KSEAB / CBSE / ICSE.",
      key_action: "Obtain SSLC Marks Card & Board Transfer Certificate"
    },
    {
      id: "ms-c10-2",
      step_number: 2,
      title: "Choose Post-10th Education Direction",
      description: "Select between PUC academic streams, Polytechnic engineering diploma, or ITI vocational trade training based on your career interests.",
      key_action: "Apply for Admissions on DPUE / DTE / DET Counseling Portal"
    }
  ]
};
var buildSearchIndex = (apiPathways) => {
  const index = [];
  apiPathways.forEach((pathway) => {
    const meta = PRESENTATION_METADATA[pathway.id] || {};
    const aliases = meta.searchAliases || [];
    index.push({
      term: pathway.title,
      type: "pathway",
      pathwayId: pathway.id,
      pathway,
      subtitle: `${pathway.category} \u2022 ${pathway.education_level}`
    });
    aliases.forEach((alias) => {
      index.push({
        term: alias,
        type: "alias",
        pathwayId: pathway.id,
        pathway,
        subtitle: `Keyword for ${pathway.title}`
      });
    });
    if (pathway.options && Array.isArray(pathway.options)) {
      pathway.options.forEach((opt) => {
        index.push({
          term: opt.option_name,
          type: "option",
          pathwayId: pathway.id,
          option: opt,
          pathway,
          subtitle: `Option in ${pathway.title}`
        });
        if (opt.stream_or_code) {
          index.push({
            term: opt.stream_or_code,
            type: "code",
            pathwayId: pathway.id,
            option: opt,
            pathway,
            subtitle: `Code in ${pathway.title}`
          });
        }
      });
    }
    if (pathway.milestones && Array.isArray(pathway.milestones)) {
      pathway.milestones.forEach((ms) => {
        if (ms.key_action) {
          index.push({
            term: ms.key_action,
            type: "milestone",
            pathwayId: pathway.id,
            pathway,
            subtitle: `Milestone Action in ${pathway.title}`
          });
        }
      });
    }
  });
  return index;
};
var getInitialNodeFromProfile = (profile) => {
  if (!profile || !profile.current_level) {
    return "c10";
  }
  const cleanLevel = profile.current_level.trim();
  const cleanStream = (profile.stream || "").trim().toLowerCase();
  if (cleanLevel === "Class 8" || cleanLevel === "Class 9" || cleanLevel === "Class 10") {
    return "c10";
  }
  if (cleanLevel.includes("PUC")) {
    if (cleanStream === "commerce") return "puc-commerce";
    if (cleanStream === "arts") return "puc-arts";
    return "puc-science";
  }
  if (cleanLevel.includes("Polytechnic") || cleanLevel.includes("Diploma")) {
    return "dip-family-comp";
  }
  if (cleanLevel.includes("ITI")) {
    return "iti-family-elec";
  }
  return "c10";
};
var getBreadcrumbTrail = (targetId, apiPathwaysMap) => {
  const trail = [];
  let currentId = targetId;
  const visited = /* @__PURE__ */ new Set();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    if (STRUCTURAL_HIERARCHY[currentId]) {
      const struct = STRUCTURAL_HIERARCHY[currentId];
      const apiObj = apiPathwaysMap[currentId];
      trail.unshift({
        id: currentId,
        label: apiObj ? apiObj.title : struct.label,
        stage: struct.stage,
        isStructural: true
      });
      currentId = struct.parent;
    } else if (currentId === "c10") {
      trail.unshift({
        id: "c10",
        label: "Class 10 / SSLC",
        stage: "SSLC",
        isStructural: true
      });
      break;
    } else {
      const apiObj = apiPathwaysMap[currentId];
      if (apiObj) {
        trail.unshift({
          id: currentId,
          label: apiObj.title,
          stage: "Choice Direction",
          isStructural: false
        });
        currentId = apiObj.parent_id || "puc-science-pcmb";
      } else {
        break;
      }
    }
  }
  return trail;
};

// src/components/product/PathwayChoiceExplorer.jsx
var PathwayChoiceExplorer = ({
  parentContextPathway,
  choicePathways = [],
  selectedDirectionId,
  onSelectDirection,
  recommendations,
  isCombinationStep = false
}) => {
  if (!parentContextPathway) return null;
  const recMap = {};
  if (recommendations && recommendations.recommendations) {
    recommendations.recommendations.forEach((item) => {
      recMap[item.pathway_id] = item;
    });
  }
  let headerCopy = "Select a direction to explore courses, eligibility, entrance routes, and step-by-step milestones.";
  if (!isCombinationStep && parentContextPathway.id === "puc-science") {
    headerCopy = "Choose a PUC Science combination to see where it can lead.";
  } else if (!isCombinationStep && parentContextPathway.id === "puc-commerce") {
    headerCopy = "Choose a PUC Commerce track to explore specialized career choices.";
  } else if (!isCombinationStep && parentContextPathway.id === "puc-arts") {
    headerCopy = "Choose an Arts & Humanities combination to see available degree paths.";
  } else if (isCombinationStep) {
    headerCopy = "Select a career direction to explore courses, eligibility, entrance routes, and step-by-step milestones.";
  } else if (parentContextPathway.id?.startsWith("dip-") || parentContextPathway.id?.startsWith("iti-")) {
    headerCopy = "Select a specialized technical program or career progression.";
  }
  return /* @__PURE__ */ React7.createElement("div", { className: "bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 font-sans" }, /* @__PURE__ */ React7.createElement("div", { className: "border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" }, /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("div", { className: "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80 mb-1" }, /* @__PURE__ */ React7.createElement(Layers2, { className: "w-3.5 h-3.5 text-[#F97316]" }), /* @__PURE__ */ React7.createElement("span", null, "CHOICE EXPLORER \u2022 ", parentContextPathway.title?.toUpperCase())), /* @__PURE__ */ React7.createElement("h2", { className: "text-lg sm:text-xl font-black text-slate-900 tracking-tight" }, "Where can this take you?"), /* @__PURE__ */ React7.createElement("p", { className: "text-xs text-slate-500 mt-0.5 leading-relaxed font-medium" }, headerCopy)), /* @__PURE__ */ React7.createElement("div", { className: "bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-[11px] font-extrabold text-slate-600 self-start sm:self-auto shrink-0" }, /* @__PURE__ */ React7.createElement("span", { className: "text-[#005F60] font-black" }, choicePathways.length), " Available Choices")), /* @__PURE__ */ React7.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3.5" }, choicePathways.map((pathway) => {
    const meta = PRESENTATION_METADATA[pathway.id] || {};
    const IconComponent = meta.icon || BookOpen2;
    const isSelected = selectedDirectionId === pathway.id;
    const recItem = recMap[pathway.id];
    const sampleOptions = (pathway.options || []).slice(0, 3);
    return /* @__PURE__ */ React7.createElement(
      "div",
      {
        key: pathway.id,
        onClick: () => onSelectDirection(pathway.id),
        className: `group relative border rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${isSelected ? "bg-gradient-to-b from-teal-50/90 to-white border-[#005F60] ring-2 ring-[#005F60]/20 shadow-sm transform -translate-y-0.5" : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-teal-300 shadow-2xs hover:shadow-xs"}`
      },
      /* @__PURE__ */ React7.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React7.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React7.createElement("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isSelected ? "bg-[#005F60] text-white shadow-xs" : "bg-teal-50 text-[#005F60] group-hover:bg-[#005F60] group-hover:text-white"}` }, /* @__PURE__ */ React7.createElement(IconComponent, { className: "w-4.5 h-4.5" })), recItem && /* @__PURE__ */ React7.createElement("span", { className: "inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs" }, /* @__PURE__ */ React7.createElement(Sparkles4, { className: "w-2.5 h-2.5" }), /* @__PURE__ */ React7.createElement("span", null, recItem.match_label === "High" ? "RECOMMENDED" : "GOOD MATCH"))), /* @__PURE__ */ React7.createElement("div", null, meta.shortTag && /* @__PURE__ */ React7.createElement("span", { className: "text-[9.5px] font-black uppercase tracking-wider text-[#005F60] block" }, meta.shortTag), /* @__PURE__ */ React7.createElement("h3", { className: "font-black text-sm text-slate-900 group-hover:text-[#005F60] transition-colors leading-snug" }, pathway.title)), /* @__PURE__ */ React7.createElement("p", { className: "text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed font-normal" }, pathway.description)),
      /* @__PURE__ */ React7.createElement("div", { className: "space-y-2 pt-1 border-t border-slate-100" }, meta.entranceBadge && /* @__PURE__ */ React7.createElement("div", { className: "inline-flex items-center gap-1.5 text-[9.5px] font-extrabold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md" }, /* @__PURE__ */ React7.createElement(Award, { className: "w-3 h-3 text-amber-600 shrink-0" }), /* @__PURE__ */ React7.createElement("span", null, meta.entranceBadge)), sampleOptions.length > 0 && /* @__PURE__ */ React7.createElement("div", { className: "flex flex-wrap gap-1" }, sampleOptions.map((opt) => /* @__PURE__ */ React7.createElement(
        "span",
        {
          key: opt.id || opt.option_name,
          className: "text-[9.5px] font-bold text-slate-700 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-md"
        },
        opt.option_name
      )))),
      /* @__PURE__ */ React7.createElement("div", { className: "pt-1 flex items-center justify-between text-[11px] font-black" }, /* @__PURE__ */ React7.createElement("span", { className: isSelected ? "text-[#005F60]" : "text-slate-500 group-hover:text-[#005F60]" }, isSelected ? "Viewing Details" : !isCombinationStep ? "Explore Choices" : "Select Direction"), /* @__PURE__ */ React7.createElement("div", { className: `w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? "bg-[#005F60] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#005F60] group-hover:text-white"}` }, /* @__PURE__ */ React7.createElement(ArrowRight2, { className: "w-3 h-3" })))
    );
  })));
};
var PathwayChoiceExplorer_default = PathwayChoiceExplorer;

// src/components/product/PathwayDetailPanel.jsx
import React8 from "react";
import {
  Info,
  ShieldCheck as ShieldCheck2,
  Award as Award2,
  Layers as Layers3,
  CheckCircle2 as CheckCircle22,
  Target,
  Check,
  Clock,
  Sparkles as Sparkles5,
  AlertCircle as AlertCircle3,
  BookOpen as BookOpen3,
  Compass as Compass3
} from "lucide-react";

// src/utils/errorHandler.js
var normalizeApiError = (err, fallbackMessage = "An unexpected error occurred.") => {
  if (!err) return fallbackMessage;
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }
  if (Array.isArray(err) && err.length > 0) {
    const messages = err.map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return item.msg || item.message || JSON.stringify(item);
      }
      return String(item);
    }).filter(Boolean);
    if (messages.length > 0) {
      return messages.join(", ");
    }
  }
  const detail = err.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return item.msg || item.message || JSON.stringify(item);
      }
      return String(item);
    }).filter(Boolean);
    if (messages.length > 0) {
      return messages.join(", ");
    }
  }
  if (detail && typeof detail === "object") {
    const msg = detail.msg || detail.message;
    if (typeof msg === "string" && msg.trim()) {
      return msg.trim();
    }
    try {
      return JSON.stringify(detail);
    } catch {
    }
  }
  if (typeof err.response?.data?.message === "string" && err.response.data.message.trim()) {
    return err.response.data.message.trim();
  }
  if (typeof err.msg === "string" && err.msg.trim()) {
    return err.msg.trim();
  }
  if (typeof err.detail === "string" && err.detail.trim()) {
    return err.detail.trim();
  }
  if (typeof err.message === "string" && err.message.trim()) {
    return err.message.trim();
  }
  if (typeof err === "object" && Object.keys(err).length > 0) {
    try {
      return JSON.stringify(err);
    } catch {
    }
  }
  return fallbackMessage;
};

// src/components/product/PathwayDetailPanel.jsx
var PathwayDetailPanel = ({
  detail,
  loading,
  error,
  onRetry,
  onSelectGoal,
  recommendations,
  selectedOptionId
}) => {
  if (loading) {
    return /* @__PURE__ */ React8.createElement("div", { className: "bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 animate-pulse font-sans" }, /* @__PURE__ */ React8.createElement("div", { className: "h-5 bg-slate-200 rounded w-1/3" }), /* @__PURE__ */ React8.createElement("div", { className: "h-7 bg-slate-200 rounded w-3/4" }), /* @__PURE__ */ React8.createElement("div", { className: "h-20 bg-slate-100 rounded-2xl" }), /* @__PURE__ */ React8.createElement("div", { className: "h-32 bg-slate-100 rounded-2xl" }));
  }
  if (error) {
    const errorText = normalizeApiError(error, "Error loading pathway details.");
    return /* @__PURE__ */ React8.createElement("div", { className: "bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-3 text-rose-900 font-sans" }, /* @__PURE__ */ React8.createElement("div", { className: "flex items-center space-x-2 font-bold text-sm" }, /* @__PURE__ */ React8.createElement(AlertCircle3, { className: "w-5 h-5 text-rose-600" }), /* @__PURE__ */ React8.createElement("span", null, "Error Loading Detail")), /* @__PURE__ */ React8.createElement("p", { className: "text-xs text-rose-700" }, errorText), /* @__PURE__ */ React8.createElement(
      "button",
      {
        type: "button",
        onClick: () => onRetry?.(),
        className: "bg-rose-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer"
      },
      "Retry"
    ));
  }
  if (!detail) {
    return /* @__PURE__ */ React8.createElement("div", { className: "bg-white border border-slate-200/90 rounded-3xl p-8 text-center text-slate-400 space-y-3 font-sans" }, /* @__PURE__ */ React8.createElement("div", { className: "w-12 h-12 rounded-2xl bg-teal-50 text-[#005F60] flex items-center justify-center mx-auto" }, /* @__PURE__ */ React8.createElement(BookOpen3, { className: "w-6 h-6" })), /* @__PURE__ */ React8.createElement("h4", { className: "text-sm font-extrabold text-slate-700" }, "Explore Education Directions"), /* @__PURE__ */ React8.createElement("p", { className: "text-xs text-slate-500 leading-relaxed max-w-xs mx-auto" }, "Select any node on the map or choice direction card to view complete options, entrance routes, and milestones."));
  }
  const meta = PRESENTATION_METADATA[detail.id] || {};
  let recItem = null;
  if (recommendations && recommendations.recommendations) {
    recItem = recommendations.recommendations.find((r) => r.pathway_id === detail.id);
  }
  const firstElig = detail.options?.find((o) => o.eligibility)?.eligibility;
  return /* @__PURE__ */ React8.createElement("div", { className: "bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs font-sans max-h-[780px] overflow-y-auto" }, /* @__PURE__ */ React8.createElement("div", { className: "border-b border-slate-100 pb-4 space-y-2" }, /* @__PURE__ */ React8.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React8.createElement("span", { className: "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-[#005F60]" }, detail.category || "CAREER DIRECTION"), detail.duration && /* @__PURE__ */ React8.createElement("span", { className: "inline-flex items-center gap-1 text-[10px] font-black text-[#F97316] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-md" }, /* @__PURE__ */ React8.createElement(Clock, { className: "w-3 h-3 text-[#F97316]" }), /* @__PURE__ */ React8.createElement("span", null, detail.duration))), /* @__PURE__ */ React8.createElement("h2", { className: "text-lg sm:text-xl font-black text-slate-900 leading-tight" }, detail.title), recItem && /* @__PURE__ */ React8.createElement("div", { className: "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-xl p-3 text-xs space-y-1" }, /* @__PURE__ */ React8.createElement("span", { className: "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#F97316]" }, /* @__PURE__ */ React8.createElement(Sparkles5, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React8.createElement("span", null, "Recommended Match (", recItem.match_score, "%)")), recItem.reasons && recItem.reasons.length > 0 && /* @__PURE__ */ React8.createElement("p", { className: "text-[11px] text-slate-700 font-semibold leading-relaxed" }, recItem.reasons[0]))), /* @__PURE__ */ React8.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ React8.createElement("h3", { className: "text-[10px] font-black uppercase tracking-wider text-[#005F60] flex items-center gap-1" }, /* @__PURE__ */ React8.createElement(Info, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React8.createElement("span", null, "What is this?")), /* @__PURE__ */ React8.createElement("p", { className: "text-xs text-slate-600 leading-relaxed font-semibold" }, detail.description)), (firstElig || meta.entranceBadge) && !detail.isStructuralOnly && /* @__PURE__ */ React8.createElement("div", { className: "bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs" }, firstElig && /* @__PURE__ */ React8.createElement("div", { className: "space-y-0.5" }, /* @__PURE__ */ React8.createElement("span", { className: "text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1" }, /* @__PURE__ */ React8.createElement(ShieldCheck2, { className: "w-3.5 h-3.5 text-emerald-600" }), /* @__PURE__ */ React8.createElement("span", null, "Eligibility Prerequisite")), /* @__PURE__ */ React8.createElement("p", { className: "text-[11px] font-bold text-slate-700" }, firstElig)), meta.entranceBadge && /* @__PURE__ */ React8.createElement("div", { className: "pt-2 border-t border-slate-200/60 space-y-0.5" }, /* @__PURE__ */ React8.createElement("span", { className: "text-[9px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1" }, /* @__PURE__ */ React8.createElement(Award2, { className: "w-3.5 h-3.5 text-amber-600" }), /* @__PURE__ */ React8.createElement("span", null, "Entrance / Admission Route")), /* @__PURE__ */ React8.createElement("p", { className: "text-[11px] font-extrabold text-amber-900" }, meta.entranceBadge))), detail.options && detail.options.length > 0 && /* @__PURE__ */ React8.createElement("div", { className: "space-y-2.5" }, /* @__PURE__ */ React8.createElement("h3", { className: "text-[10px] font-black uppercase tracking-wider text-[#005F60] flex items-center gap-1" }, /* @__PURE__ */ React8.createElement(Layers3, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React8.createElement("span", null, "Available Streams & Branches (", detail.options.length, ")")), /* @__PURE__ */ React8.createElement("div", { className: "space-y-2" }, detail.options.map((opt) => {
    const isOptionHighlighted = selectedOptionId === opt.id;
    return /* @__PURE__ */ React8.createElement(
      "div",
      {
        key: opt.id,
        className: `border rounded-xl p-3 space-y-1 text-xs transition-all ${isOptionHighlighted ? "bg-teal-50/70 border-[#005F60] ring-2 ring-[#005F60]/20 shadow-xs" : "bg-[#F8FAF8] border-slate-200/80"}`
      },
      /* @__PURE__ */ React8.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React8.createElement("span", { className: "font-extrabold text-slate-900 text-xs flex items-center gap-1.5" }, opt.option_name, isOptionHighlighted && /* @__PURE__ */ React8.createElement("span", { className: "text-[9px] font-black uppercase tracking-wider text-[#005F60] bg-teal-100 px-1.5 py-0.5 rounded" }, "SEARCH MATCH")), opt.stream_or_code && /* @__PURE__ */ React8.createElement("span", { className: "text-[9px] font-mono font-black text-[#005F60] bg-teal-100/80 px-2 py-0.5 rounded" }, opt.stream_or_code)),
      /* @__PURE__ */ React8.createElement("p", { className: "text-[11px] text-slate-600 leading-normal" }, opt.description),
      onSelectGoal && !detail.isStructuralOnly && /* @__PURE__ */ React8.createElement("div", { className: "pt-1 flex justify-end" }, /* @__PURE__ */ React8.createElement(
        "button",
        {
          type: "button",
          onClick: () => onSelectGoal(detail, opt),
          className: "bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
        },
        /* @__PURE__ */ React8.createElement(Target, { className: "w-3 h-3" }),
        /* @__PURE__ */ React8.createElement("span", null, "Choose Option Goal")
      ))
    );
  }))), detail.milestones && detail.milestones.length > 0 && /* @__PURE__ */ React8.createElement("div", { className: "space-y-3 pt-1" }, /* @__PURE__ */ React8.createElement("h3", { className: "text-[10px] font-black uppercase tracking-wider text-[#F97316] flex items-center gap-1" }, /* @__PURE__ */ React8.createElement(Award2, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React8.createElement("span", null, "Action Milestones (", detail.milestones.length, ")")), /* @__PURE__ */ React8.createElement("div", { className: "space-y-2.5" }, detail.milestones.map((ms) => /* @__PURE__ */ React8.createElement("div", { key: ms.id, className: "flex items-start gap-2.5 text-xs bg-[#F8FAF8] border border-slate-200/80 rounded-xl p-3" }, /* @__PURE__ */ React8.createElement("div", { className: "w-6 h-6 rounded-full bg-[#005F60] text-white flex items-center justify-center font-black text-[11px] shrink-0" }, ms.step_number), /* @__PURE__ */ React8.createElement("div", { className: "space-y-0.5" }, /* @__PURE__ */ React8.createElement("h4", { className: "font-extrabold text-slate-900 text-xs" }, ms.title), /* @__PURE__ */ React8.createElement("p", { className: "text-[11px] text-slate-600 leading-relaxed" }, ms.description), ms.key_action && /* @__PURE__ */ React8.createElement("div", { className: "pt-1 text-[10px] font-bold text-[#005F60] flex items-center gap-1" }, /* @__PURE__ */ React8.createElement(CheckCircle22, { className: "w-3 h-3 text-[#005F60]" }), /* @__PURE__ */ React8.createElement("span", null, "Action: ", ms.key_action))))))), onSelectGoal && !detail.isStructuralOnly && /* @__PURE__ */ React8.createElement("div", { className: "pt-3 border-t border-slate-100" }, /* @__PURE__ */ React8.createElement(
    "button",
    {
      type: "button",
      onClick: () => onSelectGoal(detail, null),
      className: "w-full bg-[#005F60] hover:bg-teal-800 text-white font-black py-3 px-4 rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
    },
    /* @__PURE__ */ React8.createElement(Target, { className: "w-4 h-4 text-[#F97316]" }),
    /* @__PURE__ */ React8.createElement("span", null, "Choose This Direction")
  )), detail.isStructuralOnly && /* @__PURE__ */ React8.createElement("div", { className: "pt-3 border-t border-slate-100 text-center" }, /* @__PURE__ */ React8.createElement("div", { className: "inline-flex items-center gap-1.5 text-xs font-extrabold text-[#005F60] bg-teal-50 border border-teal-200/80 px-3 py-2 rounded-xl" }, /* @__PURE__ */ React8.createElement(Compass3, { className: "w-4 h-4 text-[#F97316]" }), /* @__PURE__ */ React8.createElement("span", null, "Select a route from the map to explore career goals"))));
};
var PathwayDetailPanel_default = PathwayDetailPanel;

// src/components/product/PathwayBreadcrumb.jsx
import React9 from "react";
import { ChevronRight as ChevronRight2, MapPin, RefreshCw, Compass as Compass4 } from "lucide-react";
var PathwayBreadcrumb = ({
  selectedPathwayId,
  apiPathwaysMap,
  onSelectNode,
  onResetView,
  studentLevel
}) => {
  const trail = getBreadcrumbTrail(selectedPathwayId, apiPathwaysMap);
  return /* @__PURE__ */ React9.createElement("div", { className: "bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-sans" }, /* @__PURE__ */ React9.createElement("div", { className: "flex flex-wrap items-center gap-1.5 min-w-0" }, /* @__PURE__ */ React9.createElement("div", { className: "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#005F60] bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md shrink-0" }, /* @__PURE__ */ React9.createElement(MapPin, { className: "w-3 h-3 text-[#F97316]" }), /* @__PURE__ */ React9.createElement("span", null, "YOU ARE HERE")), /* @__PURE__ */ React9.createElement(ChevronRight2, { className: "w-3.5 h-3.5 text-slate-300 shrink-0" }), trail.map((item, index) => {
    const isLast = index === trail.length - 1;
    return /* @__PURE__ */ React9.createElement(React9.Fragment, { key: `${item.id}-${index}` }, index > 0 && /* @__PURE__ */ React9.createElement(ChevronRight2, { className: "w-3.5 h-3.5 text-slate-300 shrink-0" }), /* @__PURE__ */ React9.createElement(
      "button",
      {
        type: "button",
        onClick: () => onSelectNode(item.id),
        className: `font-bold transition-all px-2 py-1 rounded-md text-left truncate max-w-[200px] cursor-pointer ${isLast ? "bg-[#005F60] text-white shadow-xs font-black" : "text-slate-600 hover:text-[#005F60] hover:bg-slate-100"}`,
        title: item.label
      },
      item.label
    ));
  })), /* @__PURE__ */ React9.createElement(
    "button",
    {
      type: "button",
      onClick: onResetView,
      className: "inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 hover:text-[#005F60] bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0",
      title: "Reset view to your profile starting point"
    },
    /* @__PURE__ */ React9.createElement(RefreshCw, { className: "w-3 h-3 text-[#005F60]" }),
    /* @__PURE__ */ React9.createElement("span", null, "Reset Start View")
  ));
};
var PathwayBreadcrumb_default = PathwayBreadcrumb;

// src/components/product/PathwaySearch.jsx
import React10, { useState as useState6, useEffect as useEffect5, useRef as useRef3 } from "react";
import { Search as Search2, X as X4, Compass as Compass5, ChevronRight as ChevronRight3, Layers as Layers4 } from "lucide-react";
var PathwaySearch = ({ apiPathways = [], onSelectResult }) => {
  const [query, setQuery] = useState6("");
  const [isOpen, setIsOpen] = useState6(false);
  const [results, setResults] = useState6([]);
  const wrapperRef = useRef3(null);
  const searchIndexRef = useRef3([]);
  useEffect5(() => {
    if (apiPathways && apiPathways.length > 0) {
      searchIndexRef.current = buildSearchIndex(apiPathways);
    }
  }, [apiPathways]);
  useEffect5(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect5(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const clean = query.trim().toLowerCase();
    const matches = [];
    const seen = /* @__PURE__ */ new Set();
    searchIndexRef.current.forEach((item) => {
      if (item.term.toLowerCase().includes(clean)) {
        const key = `${item.pathwayId}-${item.term}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push(item);
        }
      }
    });
    setResults(matches.slice(0, 8));
    setIsOpen(matches.length > 0);
  }, [query]);
  const handleSelect = (item) => {
    setQuery(item.term);
    setIsOpen(false);
    onSelectResult({
      pathwayId: item.pathwayId,
      pathway: item.pathway,
      option: item.option || null
    });
  };
  return /* @__PURE__ */ React10.createElement("div", { ref: wrapperRef, className: "relative w-full font-sans" }, /* @__PURE__ */ React10.createElement("div", { className: "relative" }, /* @__PURE__ */ React10.createElement(Search2, { className: "w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ React10.createElement(
    "input",
    {
      type: "text",
      value: query,
      onChange: (e) => setQuery(e.target.value),
      onFocus: () => query.trim() && results.length > 0 && setIsOpen(true),
      placeholder: "Search course or career (e.g. MBBS, NEET, BCA, CSE, CA, Law, Nursing, DCET)...",
      className: "w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 text-xs font-semibold placeholder:text-slate-400 pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 focus:border-[#005F60] focus:ring-2 focus:ring-[#005F60]/20 transition-all outline-none"
    }
  ), query && /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setQuery("");
        setIsOpen(false);
      },
      className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
    },
    /* @__PURE__ */ React10.createElement(X4, { className: "w-3.5 h-3.5" })
  )), isOpen && results.length > 0 && /* @__PURE__ */ React10.createElement("div", { className: "absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100" }, results.map((item, idx) => /* @__PURE__ */ React10.createElement(
    "div",
    {
      key: `${item.pathwayId}-${item.term}-${idx}`,
      onClick: () => handleSelect(item),
      className: "p-3 hover:bg-teal-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
    },
    /* @__PURE__ */ React10.createElement("div", { className: "space-y-0.5 min-w-0" }, /* @__PURE__ */ React10.createElement("div", { className: "font-extrabold text-slate-900 truncate" }, item.term), /* @__PURE__ */ React10.createElement("div", { className: "text-[10px] text-slate-500 font-semibold truncate" }, item.subtitle)),
    /* @__PURE__ */ React10.createElement("div", { className: "flex items-center gap-1 text-[10px] font-black text-[#005F60] shrink-0" }, /* @__PURE__ */ React10.createElement("span", null, "View"), /* @__PURE__ */ React10.createElement(ChevronRight3, { className: "w-3 h-3" }))
  ))));
};
var PathwaySearch_default = PathwaySearch;

// src/pages/PathwaysPage.jsx
import {
  Compass as Compass6,
  ArrowLeft,
  RefreshCw as RefreshCw2,
  AlertCircle as AlertCircle4,
  Info as Info2,
  Target as Target2,
  ArrowRight as ArrowRight3,
  Loader2
} from "lucide-react";
var PathwaysPage = () => {
  const navigate = useNavigate3();
  const location = useLocation2();
  const { profile, loading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const [isSidebarOpen, setIsSidebarOpen] = useState7(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState7(false);
  const [recommendations, setRecommendations] = useState7(null);
  const [recsLoading, setRecsLoading] = useState7(true);
  const targetPathwayIdRef = useRef4(null);
  const [pathways, setPathways] = useState7([]);
  const [loading, setLoading] = useState7(true);
  const [error, setError] = useState7(null);
  const [selectedStructuralNodeId, setSelectedStructuralNodeId] = useState7("c10");
  const [selectedCombinationId, setSelectedCombinationId] = useState7(null);
  const [selectedCareerDirectionId, setSelectedCareerDirectionId] = useState7(null);
  const [selectedOptionId, setSelectedOptionId] = useState7(null);
  const [selectedPathwayDetail, setSelectedPathwayDetail] = useState7(null);
  const [detailLoading, setDetailLoading] = useState7(false);
  const [detailError, setDetailError] = useState7(null);
  const [goalModalData, setGoalModalData] = useState7(null);
  const [submittingGoal, setSubmittingGoal] = useState7(false);
  const [goalError, setGoalError] = useState7(null);
  const apiPathwaysMap = useMemo(() => {
    const map = {};
    pathways.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [pathways]);
  useEffect6(() => {
    const params = new URLSearchParams(location.search);
    const hasQueryParam = Boolean(params.get("pathway_id") || params.get("id") || params.get("node"));
    if (profile && !hasQueryParam) {
      const initialNode = getInitialNodeFromProfile(profile);
      setSelectedStructuralNodeId(initialNode);
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      setSelectedOptionId(null);
    }
  }, [profile, location.search]);
  const resolvePathwayHierarchy = (pathwayId) => {
    if (!pathwayId) return;
    if (pathwayId === "c10") {
      setSelectedStructuralNodeId("c10");
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      return;
    }
    if (pathwayId === "puc-science" || pathwayId === "puc-commerce" || pathwayId === "puc-arts" || pathwayId.startsWith("dip-") || pathwayId.startsWith("iti-") || pathwayId === "c10-puc" || pathwayId === "c10-diploma" || pathwayId === "c10-iti") {
      const visualNode = getVisualNodeId(pathwayId);
      setSelectedStructuralNodeId(visualNode);
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      return;
    }
    if (BRANCH_CHOICE_MAPPING[pathwayId]) {
      const parentStream = STRUCTURAL_HIERARCHY[pathwayId]?.parent || getVisualNodeId(pathwayId);
      setSelectedStructuralNodeId(parentStream);
      setSelectedCombinationId(pathwayId);
      setSelectedCareerDirectionId(null);
      return;
    }
    const structParent = STRUCTURAL_HIERARCHY[pathwayId]?.parent || "puc-science-pcmb";
    const grandParentStream = STRUCTURAL_HIERARCHY[structParent]?.parent || getVisualNodeId(structParent);
    setSelectedStructuralNodeId(grandParentStream);
    setSelectedCombinationId(structParent);
    setSelectedCareerDirectionId(pathwayId);
  };
  useEffect6(() => {
    const params = new URLSearchParams(location.search);
    const pathwayIdParam = params.get("pathway_id") || params.get("id") || params.get("node");
    if (pathwayIdParam) {
      targetPathwayIdRef.current = pathwayIdParam;
      resolvePathwayHierarchy(pathwayIdParam);
    }
  }, [location.search]);
  useEffect6(() => {
    if (authLoading) return;
    const fetchRecommendations = async () => {
      setRecsLoading(true);
      try {
        const recRes = await getLatestRecommendationsApi();
        setRecommendations(recRes || null);
      } catch (err) {
        if (err?.response?.status === 404 || err?.response?.status === 401) {
          setRecommendations(null);
        } else {
          console.error("Failed to load recommendations:", err);
        }
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecommendations();
  }, [authLoading]);
  const listRequestIdRef = useRef4(0);
  const detailRequestIdRef = useRef4(0);
  const isMountedRef = useRef4(true);
  useEffect6(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const fetchPathways = useCallback(async (shouldCancel = () => false) => {
    const checkCancel = typeof shouldCancel === "function" ? shouldCancel : () => false;
    const requestId = ++listRequestIdRef.current;
    const isCancelled = () => {
      if (!isMountedRef.current) return true;
      if (requestId !== listRequestIdRef.current) return true;
      return checkCancel();
    };
    setLoading(true);
    setError(null);
    try {
      const data = await getPathwaysApi();
      if (isCancelled()) return;
      setPathways(data.pathways || []);
      if (data.pathways && data.pathways.length > 0) {
        const targetId = targetPathwayIdRef.current;
        if (targetId) {
          resolvePathwayHierarchy(targetId);
        }
        targetPathwayIdRef.current = null;
      }
    } catch (err) {
      if (isCancelled()) return;
      setError(normalizeApiError(err, "Failed to load pathways from server."));
      setPathways([]);
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, []);
  useEffect6(() => {
    if (authLoading) return;
    let isCancelled = false;
    fetchPathways(() => isCancelled);
    return () => {
      isCancelled = true;
    };
  }, [authLoading, fetchPathways]);
  const currentChoicePathways = useMemo(() => {
    if (selectedCombinationId && BRANCH_CHOICE_MAPPING[selectedCombinationId]) {
      const ids = BRANCH_CHOICE_MAPPING[selectedCombinationId];
      return ids.map((id) => apiPathwaysMap[id]).filter(Boolean);
    } else {
      const ids = STREAM_COMBINATIONS_MAPPING[selectedStructuralNodeId] || [];
      return ids.map((id) => apiPathwaysMap[id]).filter(Boolean);
    }
  }, [selectedStructuralNodeId, selectedCombinationId, apiPathwaysMap]);
  const parentContextPathway = useMemo(() => {
    if (selectedCombinationId) {
      return apiPathwaysMap[selectedCombinationId] || { id: selectedCombinationId, title: "Combination" };
    }
    return apiPathwaysMap[selectedStructuralNodeId] || { id: selectedStructuralNodeId, title: "Selected Stream" };
  }, [selectedStructuralNodeId, selectedCombinationId, apiPathwaysMap]);
  const loadPathwayDetail = useCallback(async (canonicalId) => {
    if (!canonicalId) {
      detailRequestIdRef.current++;
      setSelectedPathwayDetail(C10_STRUCTURAL_DETAIL);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }
    const requestId = ++detailRequestIdRef.current;
    const isCancelled = () => {
      return !isMountedRef.current || requestId !== detailRequestIdRef.current;
    };
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detailData = await getPathwayDetailApi(canonicalId);
      if (isCancelled()) return;
      setSelectedPathwayDetail(detailData);
      setDetailError(null);
    } catch (err) {
      if (isCancelled()) return;
      setDetailError(normalizeApiError(err, "Failed to load pathway details."));
      setSelectedPathwayDetail(null);
    } finally {
      if (!isCancelled()) {
        setDetailLoading(false);
      }
    }
  }, []);
  useEffect6(() => {
    const activeId = selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId;
    if (!activeId) return;
    const canonicalId = getCanonicalPathwayId(activeId);
    loadPathwayDetail(canonicalId);
  }, [selectedCareerDirectionId, selectedCombinationId, selectedStructuralNodeId, loadPathwayDetail]);
  const handleSelectSearchResult = ({ pathwayId, option }) => {
    resolvePathwayHierarchy(pathwayId);
    if (option) {
      setSelectedOptionId(option.id);
    } else {
      setSelectedOptionId(null);
    }
    const explorerContainer = document.getElementById("hybrid-explorer-container");
    if (explorerContainer) {
      explorerContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const handleSelectChoiceDirection = (chosenId) => {
    setSelectedOptionId(null);
    if (selectedCombinationId) {
      setSelectedCareerDirectionId(chosenId);
    } else {
      if (BRANCH_CHOICE_MAPPING[chosenId]) {
        setSelectedCombinationId(chosenId);
        setSelectedCareerDirectionId(null);
      } else {
        setSelectedCareerDirectionId(chosenId);
      }
    }
  };
  const handleSelectBreadcrumbNode = (nodeId) => {
    setSelectedOptionId(null);
    resolvePathwayHierarchy(nodeId);
  };
  const handleResetView = () => {
    const initialNode = getInitialNodeFromProfile(profile);
    setSelectedStructuralNodeId(initialNode);
    setSelectedCombinationId(null);
    setSelectedCareerDirectionId(null);
    setSelectedOptionId(null);
  };
  const handleOpenGoalModal = (pathway, option = null) => {
    const realPathway = pathways.find((p) => p.id === pathway.id || p.id === pathway.pathwayId);
    if (!realPathway) {
      console.warn("Target pathway has no database backing:", pathway);
      return;
    }
    setGoalError(null);
    setGoalModalData({ pathway: realPathway, option });
  };
  const handleConfirmGoal = async () => {
    if (!goalModalData?.pathway) return;
    setSubmittingGoal(true);
    setGoalError(null);
    try {
      await createStudentGoalApi(
        goalModalData.pathway.id,
        goalModalData.option ? goalModalData.option.id : null
      );
      setGoalModalData(null);
      navigate("/my-roadmap");
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Failed to create goal:", err);
      const userMessage = normalizeApiError(err, "We couldn't save your career goal. Please try again.");
      setGoalError(userMessage);
    } finally {
      setSubmittingGoal(false);
    }
  };
  return /* @__PURE__ */ React11.createElement("div", { className: "min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white" }, /* @__PURE__ */ React11.createElement(
    Sidebar_default,
    {
      isOpen: isSidebarOpen,
      onClose: () => setIsSidebarOpen(false)
    }
  ), /* @__PURE__ */ React11.createElement("div", { className: `flex-1 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"} transition-all duration-200 ease-in-out flex flex-col min-w-0` }, /* @__PURE__ */ React11.createElement(
    Header_default,
    {
      onMenuClick: () => setIsSidebarOpen(true),
      onEditProfileClick: () => setIsEditDrawerOpen(true)
    }
  ), /* @__PURE__ */ React11.createElement("main", { className: "p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5 flex-1" }, /* @__PURE__ */ React11.createElement("div", { className: "bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4" }, /* @__PURE__ */ React11.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4" }, /* @__PURE__ */ React11.createElement("div", null, /* @__PURE__ */ React11.createElement("div", { className: "inline-flex items-center space-x-2 text-[11px] font-bold text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-1.5" }, /* @__PURE__ */ React11.createElement(Compass6, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React11.createElement("span", null, "Karnataka Student Hybrid Pathway Explorer")), /* @__PURE__ */ React11.createElement("h1", { className: "text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight" }, "Career & Education Pathways"), /* @__PURE__ */ React11.createElement("p", { className: "text-xs text-slate-500 mt-0.5 font-medium" }, "Structured SSLC, PUC, Polytechnic Diploma, and ITI trade routes under Karnataka Education Board.")), /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: () => navigate("/dashboard"),
      className: "inline-flex items-center space-x-2 text-xs font-extrabold text-slate-600 hover:text-[#005F60] bg-[#F8FAF8] hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
    },
    /* @__PURE__ */ React11.createElement(ArrowLeft, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ React11.createElement("span", null, "Back to Dashboard")
  )), /* @__PURE__ */ React11.createElement(
    PathwaySearch_default,
    {
      apiPathways: pathways,
      onSelectResult: handleSelectSearchResult
    }
  ), !recsLoading && (!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) && /* @__PURE__ */ React11.createElement("div", { className: "bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start space-x-3 text-amber-900 text-xs" }, /* @__PURE__ */ React11.createElement(Info2, { className: "w-4 h-4 text-[#F97316] flex-shrink-0 mt-0.5" }), /* @__PURE__ */ React11.createElement("div", null, /* @__PURE__ */ React11.createElement("span", { className: "font-extrabold block text-xs text-amber-950" }, "Personalized Guidance Suggestion"), /* @__PURE__ */ React11.createElement("p", { className: "text-amber-800 text-[11px] leading-relaxed font-semibold" }, "Take the career assessment to highlight personalized recommendations in your choice explorer.")))), loading && /* @__PURE__ */ React11.createElement("div", { className: "bg-white border border-slate-200 rounded-3xl p-8 space-y-4 animate-pulse" }, /* @__PURE__ */ React11.createElement("div", { className: "h-6 bg-slate-200 rounded w-1/4" }), /* @__PURE__ */ React11.createElement("div", { className: "h-20 bg-slate-100 rounded-2xl" }), /* @__PURE__ */ React11.createElement("div", { className: "h-20 bg-slate-100 rounded-2xl" })), !loading && error && /* @__PURE__ */ React11.createElement("div", { className: "bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-rose-900" }, /* @__PURE__ */ React11.createElement("div", { className: "flex items-center space-x-3" }, /* @__PURE__ */ React11.createElement(AlertCircle4, { className: "w-6 h-6 text-rose-600 flex-shrink-0" }), /* @__PURE__ */ React11.createElement("div", null, /* @__PURE__ */ React11.createElement("h3", { className: "font-extrabold text-sm" }, "Unable to Fetch Pathways"), /* @__PURE__ */ React11.createElement("p", { className: "text-xs text-rose-700 mt-0.5" }, typeof error === "string" ? error : normalizeApiError(error, "Failed to load pathways from server.")))), /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: () => fetchPathways(),
      className: "bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
    },
    /* @__PURE__ */ React11.createElement(RefreshCw2, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ React11.createElement("span", null, "Retry Fetch")
  )), !loading && !error && pathways.length > 0 && /* @__PURE__ */ React11.createElement("div", { id: "hybrid-explorer-container", className: "space-y-5" }, /* @__PURE__ */ React11.createElement(
    PathwayBreadcrumb_default,
    {
      selectedPathwayId: selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId,
      apiPathwaysMap,
      onSelectNode: handleSelectBreadcrumbNode,
      onResetView: handleResetView,
      studentLevel: profile?.current_level
    }
  ), /* @__PURE__ */ React11.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" }, /* @__PURE__ */ React11.createElement("div", { className: "lg:col-span-7 xl:col-span-8 space-y-5 min-w-0" }, /* @__PURE__ */ React11.createElement(
    EducationPathwayMap_default,
    {
      selectedNodeId: selectedStructuralNodeId,
      onSelectNode: (nodeId) => {
        setSelectedStructuralNodeId(nodeId);
        setSelectedCombinationId(null);
        setSelectedCareerDirectionId(null);
        setSelectedOptionId(null);
      },
      studentProfile: profile,
      recommendations
    }
  ), currentChoicePathways.length > 0 && /* @__PURE__ */ React11.createElement(
    PathwayChoiceExplorer_default,
    {
      parentContextPathway,
      choicePathways: currentChoicePathways,
      selectedDirectionId: selectedCareerDirectionId || selectedCombinationId,
      onSelectDirection: handleSelectChoiceDirection,
      recommendations,
      isCombinationStep: !!selectedCombinationId
    }
  )), /* @__PURE__ */ React11.createElement("div", { className: "lg:col-span-5 xl:col-span-4 sticky top-5" }, /* @__PURE__ */ React11.createElement(
    PathwayDetailPanel_default,
    {
      detail: selectedPathwayDetail,
      loading: detailLoading,
      error: detailError,
      onRetry: () => {
        const activeId = selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId;
        const canonicalId = getCanonicalPathwayId(activeId);
        loadPathwayDetail(canonicalId);
      },
      onSelectGoal: (pathway, option) => handleOpenGoalModal(pathway, option),
      recommendations,
      selectedOptionId
    }
  ))))), /* @__PURE__ */ React11.createElement("footer", { className: "border-t border-slate-200/80 bg-white py-3.5 px-8 text-center text-xs text-slate-500 mt-6" }, "Udaan AI \u2014 Simplified Hybrid Karnataka Student Pathway Explorer")), /* @__PURE__ */ React11.createElement(
    EditProfileDrawer_default,
    {
      isOpen: isEditDrawerOpen,
      onClose: () => setIsEditDrawerOpen(false)
    }
  ), goalModalData && /* @__PURE__ */ React11.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" }, /* @__PURE__ */ React11.createElement("div", { className: "bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 font-sans" }, /* @__PURE__ */ React11.createElement("div", { className: "flex items-center space-x-3 border-b border-slate-100 pb-4" }, /* @__PURE__ */ React11.createElement("div", { className: "w-10 h-10 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center" }, /* @__PURE__ */ React11.createElement(Target2, { className: "w-5 h-5" })), /* @__PURE__ */ React11.createElement("div", null, /* @__PURE__ */ React11.createElement("h3", { className: "text-lg font-black text-[#0F172A]" }, "Confirm Your Career Goal"), /* @__PURE__ */ React11.createElement("p", { className: "text-xs text-slate-500" }, "Persist your selected direction to track milestones"))), goalError && /* @__PURE__ */ React11.createElement("div", { className: "bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center space-x-2" }, /* @__PURE__ */ React11.createElement(AlertCircle4, { className: "w-4 h-4 text-rose-600 shrink-0" }), /* @__PURE__ */ React11.createElement("span", null, goalError)), /* @__PURE__ */ React11.createElement("div", { className: "bg-[#F8FAF8] border border-slate-200 rounded-2xl p-4 space-y-2 text-xs" }, /* @__PURE__ */ React11.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React11.createElement("span", { className: "text-slate-500 font-medium" }, "Target Goal"), /* @__PURE__ */ React11.createElement("span", { className: "font-extrabold text-[#005F60]" }, goalModalData.option ? goalModalData.option.option_name : goalModalData.pathway.title)), /* @__PURE__ */ React11.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React11.createElement("span", { className: "text-slate-500 font-medium" }, "Education Pathway"), /* @__PURE__ */ React11.createElement("span", { className: "font-extrabold text-[#0F172A]" }, goalModalData.pathway.title)), goalModalData.option?.eligibility && /* @__PURE__ */ React11.createElement("div", { className: "pt-2 border-t border-slate-200/60 text-[11px] text-slate-600" }, /* @__PURE__ */ React11.createElement("span", { className: "font-bold block text-slate-700 mb-0.5" }, "Eligibility Requirement:"), /* @__PURE__ */ React11.createElement("span", null, goalModalData.option.eligibility))), /* @__PURE__ */ React11.createElement("div", { className: "flex items-center space-x-3 pt-2" }, /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: () => setGoalModalData(null),
      disabled: submittingGoal,
      className: "flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
    },
    "Cancel"
  ), /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: handleConfirmGoal,
      disabled: submittingGoal,
      className: "flex-1 bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
    },
    submittingGoal ? /* @__PURE__ */ React11.createElement(React11.Fragment, null, /* @__PURE__ */ React11.createElement(Loader2, { className: "w-4 h-4 animate-spin" }), /* @__PURE__ */ React11.createElement("span", null, "Setting Goal...")) : /* @__PURE__ */ React11.createElement(React11.Fragment, null, /* @__PURE__ */ React11.createElement("span", null, "Confirm & Set Goal"), /* @__PURE__ */ React11.createElement(ArrowRight3, { className: "w-3.5 h-3.5" }))
  )))));
};
var PathwaysPage_default = PathwaysPage;
export {
  PATHWAY_ID_TO_NODE_MAP,
  PathwaysPage_default as default,
  getVisualNodeId
};
