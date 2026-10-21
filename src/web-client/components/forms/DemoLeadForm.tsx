"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function DemoLeadForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const utm = Object.fromEntries(
      [...new URLSearchParams(window.location.search).entries()]
        .filter(([key]) => key.startsWith("utm_"))
        .slice(0, 8),
    );

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          studentName: values.get("studentName"),
          phone: values.get("phone"),
          email: values.get("email"),
          studentClass: values.get("studentClass"),
          board: values.get("board"),
          interest: "SmartNum free assessment",
          preferredTime: values.get("preferredTime"),
          message: values.get("message"),
          acceptedConsent: values.get("acceptedConsent") === "on",
          companyWebsite: values.get("companyWebsite"),
          utm,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(response.status === 429
          ? "We’ve received several requests from this connection. Please try again in a little while."
          : "We couldn’t save your request. Please check your details and try again.");
        return;
      }
      setMessage(result.data?.message ?? "Thanks. We’ll be in touch.");
      form.reset();
    } catch {
      setError("We couldn’t reach the team just now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="demo-form" onSubmit={submitLead}>
      <div className="demo-form-grid">
        <label>Parent / guardian name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
        <label>Student name <span>(optional)</span><input name="studentName" autoComplete="off" maxLength={100} /></label>
        <label>Mobile number<input name="phone" type="tel" autoComplete="tel" placeholder="10-digit number" required /></label>
        <label>Email <span>(optional)</span><input name="email" type="email" autoComplete="email" maxLength={254} /></label>
        <label>Student’s class
          <select name="studentClass" defaultValue="" required>
            <option value="" disabled>Select class / target</option>
            <option>Class 9</option>
            <option>Class 10</option>
            <option>Class 11</option>
            <option>Class 12</option>
            <option>IIT-JEE Mains &amp; Advanced</option>
            <option>Foundational &amp; Olympiads</option>
          </select>
        </label>
        <label>Board
          <select name="board" defaultValue="" required>
            <option value="" disabled>Select board / ask us</option>
            <option>Any Board</option>
            <option>CBSE</option>
            <option>ICSE / ISC</option>
            <option>IGCSE / IB</option>
            <option>State board</option>
            <option>Other / discuss</option>
          </select>
        </label>
        <label className="demo-time-field">Preferred time to contact
          <select name="preferredTime" defaultValue="">
            <option value="">Choose a time</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
          </select>
        </label>
        <label className="demo-time-field">What would you like help with? <span>(optional)</span>
          <textarea name="message" rows={3} maxLength={1000} placeholder="Tell us about the topics or exam pathway you’re exploring." />
        </label>
      </div>
      <label className="demo-consent">
        <input name="acceptedConsent" type="checkbox" required />
        <span>I agree to be contacted about a demo. If the learner is under 18, a parent or guardian should submit this request.</span>
      </label>
      <label className="demo-honeypot" aria-hidden="true">Leave this field empty<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      <button className="button button-demo" type="submit" disabled={pending}>{pending ? "Sending request…" : "Request my free demo"}</button>
      <p className="demo-privacy">We’ll use these details only to respond to this request. See the <Link href="/policies/privacy">privacy draft</Link>.</p>
      {message && <p className="form-success" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}