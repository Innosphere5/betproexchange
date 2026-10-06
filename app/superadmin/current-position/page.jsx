"use client";

import CurrentPositionView from "@/components/CurrentPositionView";

export default function SuperAdminCurrentPosition() {
  return (
    <CurrentPositionView 
      role="superadmin" 
      roleTitle="SuperAdmin" 
      themeColor="#1abc9c" 
    />
  );
}
