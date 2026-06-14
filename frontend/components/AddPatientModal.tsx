"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "./ui/dialog";

export function AddPatientModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl text-slate-900">Add New Patient</DialogTitle>
            <p className="text-sm text-slate-500">Register and route to the right ward in seconds.</p>
          </DialogHeader>

          <form className="p-6 space-y-6" onSubmit={(e) => { e.preventDefault(); }}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" placeholder="Aarav" />
                <Field label="Last Name" placeholder="Rahman" />
                <Field label="Date of Birth" type="date" />
                <Field label="Phone" placeholder="+1 555-010-1010" />
                <Field label="Address" placeholder="123 Lakeshore Dr" full />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-2">Medical Information</h3>
              <Field label="Chief Complaint" placeholder="Describe the primary issue…" textarea full />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Medical History" placeholder="Diabetes, hypertension…" textarea />
                <Field label="Allergies" placeholder="Penicillin, peanuts…" textarea />
              </div>
            </div>

            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <button type="button" className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition">Cancel</button>
              </DialogClose>
              <DialogClose asChild>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">Save Patient</button>
              </DialogClose>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, placeholder, type = "text", textarea, full }: any) {
  return (
    <label className={`block ${full ? "col-span-full" : ""}`}>
      <span className="text-xs text-slate-600 font-semibold mb-1.5 block">{label}</span>
      {textarea ? (
        <textarea placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition min-h-[80px]" />
      ) : (
        <input type={type} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition" />
      )}
    </label>
  );
}
