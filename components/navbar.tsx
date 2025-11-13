"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useEffect, useState } from "react";
import {
  Navbar as AceternityNavbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "./ui/resizable-navbar";

export function Navbar() {
  const { user, isAdmin, isReadOnly, checkAuth, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Log auth status for debugging
  useEffect(() => {
    console.log('Auth status:', { 
      user: !!user, 
      isAdmin, 
      isReadOnly,
      canAccessAdmin: isAdmin || isReadOnly
    });
  }, [user, isAdmin, isReadOnly]);

  // Prevent hydration mismatch by only reading cart on client
  useEffect(() => {
    setTotalItems(useCartStore.getState().getTotalItems());
    
    const unsubscribe = useCartStore.subscribe((state) => {
      setTotalItems(state.getTotalItems());
    });
    
    return unsubscribe;
  }, []);

  const navItems = [
    { name: "Products", link: "/#products" },
    { name: "Special Deals", link: "/special-deals" },
    { name: "About Us", link: "/about" },
    { name: "Contact", link: "/contact" },
    // Manual tracking temporarily disabled - uncomment below to enable
    // { name: user ? "My Orders" : "Track Order", link: user ? "/orders" : "/track-order" },
    ...(user ? [{ name: "My Orders", link: "/orders" }] : []),
    ...((isAdmin || isReadOnly) ? [{ name: "Admin", link: "/admin" }] : []),
  ];

  const handleMobileItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <AceternityNavbar className="sticky top-0">
      {/* Desktop Navigation */}
      <NavBody>
        {/* Logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center space-x-3 px-2 py-1    "
        >
          <Image
            src="/logo.png"
            alt="Yousuf Rice Logo"
            width={100}
            height={100}
            className="object-contain    "
          />
          <span className="text-xl font-bold text-[#27247b] dark:text-white">
            Yousuf Rice
          </span>
        </Link>

        {/* Nav Items */}
        <NavItems items={navItems} />

        {/* Right Side Actions */}
        <div className="relative z-20 flex items-center space-x-2">
          {/* Cart */}
          <Link href="/cart" className="relative inline-block">
            <button className="relative p-2 text-[#27247b] hover:text-[#27247b]/80 dark:text-neutral-300 dark:hover:text-white  ">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ffff03] text-[#27247b] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none z-10">
                  {totalItems}
                </span>
              )}
            </button>
          </Link>

          {/* Auth Section */}
          {user ? (
            <div className="flex items-center space-x-2  ">
              <span className="text-sm text-[#27247b] dark:text-neutral-300 font-medium  ">
                {user.name || user.email}
              </span>
              <button
                onClick={logout}
                className="p-2 text-[#27247b] hover:text-[#27247b]/80 dark:text-neutral-300 dark:hover:text-white    "
              >
                <LogOut className="w-4 h-4  " />
              </button>
            </div>
          ) : (
            <NavbarButton
              href="/auth/login"
              className="bg-[#ffff03] text-[#27247b] hover:bg-[#ffff03]/90 font-bold  "
            >
              <User className="w-4 h-4 mr-2 inline  " />
              Login
            </NavbarButton>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader className=" -navbar">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 px-2 py-1    ">
            <Image
              src="/logo.png"
              alt="Yousuf Rice Logo"
              width={40}
              height={40}
              className="object-fit    "
            />
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Cart */}
            <Link href="/cart" className="relative inline-block    ">
              <button className="relative p-2 text-[#27247b] hover:text-[#27247b]/80 dark:text-neutral-300 dark:hover:text-white      ">
                <ShoppingCart className="w-5 h-5    " />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#ffff03] text-[#27247b] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center pointer-events-none z-10 border border-white dark:border-neutral-800 shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
            </Link>

            {/* Mobile Menu Toggle */}
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        {/* Mobile Menu */}
        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={handleMobileItemClick}
              className="text-[#27247b] dark:text-neutral-300 hover:text-[#27247b]/80 dark:hover:text-white   text-base font-medium"
            >
              {item.name}
            </Link>
          ))}


          {/* Auth Section in Mobile Menu */}
          {user ? (
            <div className="flex flex-col space-y-2 w-full pt-4 border-t border-[#27247b]/20 dark:border-neutral-800">
              <span className="text-sm text-[#27247b] dark:text-neutral-300 font-medium">
                {user.name || user.email}
              </span>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 text-[#27247b] dark:text-neutral-300 hover:text-[#27247b]/80 dark:hover:text-white  "
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="w-full pt-4 border-t border-[#27247b]/20 dark:border-neutral-800">
              <a
                href="/auth/login"
                onClick={handleMobileItemClick}
                className="flex items-center justify-center space-x-2 bg-[#ffff03] text-[#27247b] hover:bg-[#ffff03]/90   text-base font-bold py-3 px-6 rounded-lg"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </a>
            </div>
          )}
        </MobileNavMenu>
      </MobileNav>
    </AceternityNavbar>
  );
}
