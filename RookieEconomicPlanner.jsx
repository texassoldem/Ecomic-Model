import React, { useMemo, useState } from "react";

/**
 * MREA & RREA-inspired Economic Model Planner (Plain React version)
 * Full flow: Economic Stack → Conversion Funnel → Take Action!
 * Clean functionality, all goals rounded up, minimal visuals.
 */

export default function RookieEconomicPlanner() {
  const currency = (n) =>
    isFinite(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : "—";

  const rookieDefaults = {
    netIncome: 100000,
    expenses: 33333,
    cos: 33333,
    avgCommission: 10000,
    signedToClosedPct: 75,
    heldToSignedPct: 75,
    setToHeldPct: 80,
    contactsToSetPct: 8,
    vacationWeeks: 4,
    workingWeeks: 48,
    daysPerWeek: 5,
    leadGenHoursPerDay: 3,
    convosPerHour: 8,
    convosPerAppt: 100,
  };

  const millionaireDefaults = {
    netIncome: 1000000,
    expenses: 750000,
    cos: 750000,
    avgCommission: 7150,
    signedToClosedPct: 70,
    heldToSignedPct: 70,
    setToHeldPct: 75,
    contactsToSetPct: 10,
    vacationWeeks: 4,
    workingWeeks: 48,
    daysPerWeek: 5,
    leadGenHoursPerDay: 3,
    convosPerHour: 8,
    convosPerAppt: 100,
  };

  const [inputs, setInputs] = useState(rookieDefaults);

  const update = (field, value) => setInputs((s) => ({ ...s, [field]: value }));

  const handleWeeksChange = (field, value) => {
    const val = Math.max(0, Math.min(52, Number(value) || 0));
    if (field === "vacationWeeks") {
      setInputs((s) => ({ ...s, vacationWeeks: val, workingWeeks: 52 - val }));
    } else {
      setInputs((s) => ({ ...s, workingWeeks: val, vacationWeeks: 52 - val }));
    }
  };

  const calc = useMemo(() => {
    const totalGci = (inputs.netIncome || 0) + (inputs.expenses || 0) + (inputs.cos || 0);
    const rawUnits = inputs.avgCommission ? totalGci / inputs.avgCommission : 0;

    const rUnitsToClients = Math.max(0.0001, (inputs.signedToClosedPct || 0) / 100);
    const rClientsToAppts = Math.max(0.0001, (inputs.heldToSignedPct || 0) / 100);
    const rSetsToHeld = Math.max(0.0001, (inputs.setToHeldPct || 0) / 100);
    const rContactsToSets = Math.max(0.0001, (inputs.contactsToSetPct || 0) / 100);

    const unitsNeeded = Math.ceil(rawUnits);
    const signedNeeded = Math.ceil(unitsNeeded / rUnitsToClients);
    const heldNeeded = Math.ceil(signedNeeded / rClientsToAppts);

    const contactsPerHeld = 1 / (rContactsToSets * rSetsToHeld);
    const convosNeeded = Math.ceil(heldNeeded * contactsPerHeld);

    const workDays = (inputs.workingWeeks || 0) * (inputs.daysPerWeek || 0);
    const appointmentsPerWeek = inputs.workingWeeks ? Math.ceil(heldNeeded / inputs.workingWeeks) : 0;
    const weeklyConversationGoal = Math.ceil(appointmentsPerWeek * inputs.convosPerAppt);
    const dailyConversationGoal = inputs.daysPerWeek ? Math.ceil(weeklyConversationGoal / inputs.daysPerWeek) : 0;

    const feasibilityDailyCap = Math.round((inputs.leadGenHoursPerDay || 0) * (inputs.convosPerHour || 0));
    const feasible = feasibilityDailyCap >= dailyConversationGoal;

    return {
      totalGci,
      unitsNeeded,
      signedNeeded,
      heldNeeded,
      appointmentsPerWeek,
      weeklyConversationGoal,
      dailyConversationGoal,
      feasibilityDailyCap,
      feasible,
    };
  }, [inputs]);

  const Box = ({ children, style }) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff", ...style }}>{children}</div>
  );

  const Row = ({ children, style }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0", ...style }}>{children}</div>
  );

  const RightAlignedInput = ({ value, onChange }) => (
    <input type="number" value={value} onChange={onChange} style={{ width: 80, textAlign: "right" }} />
  );

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <h1>Economic Model Planner</h1>
      <p>Use this tool to reverse-engineer your income goals into daily targets.</p>

      <Row>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ background: '#374151', color: '#facc15', border: 'none', padding: '6px 12px', borderRadius: 4 }} onClick={() => setInputs(rookieDefaults)}>Rookie Defaults (RREA)</button>
          <button style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4 }} onClick={() => setInputs(millionaireDefaults)}>Millionaire Defaults (MREA)</button>
          <button onClick={() => setInputs({})}>Reset</button>
        </div>
      </Row>

      {/* Economic Stack */}
      <Box style={{ marginTop: 12 }}>
        <h3>Economic Stack</h3>
        <Row><span>Net Income</span><RightAlignedInput value={inputs.netIncome} onChange={(e) => update("netIncome", Number(e.target.value))} /></Row>
        <Row><span>Operating Expenses</span><RightAlignedInput value={inputs.expenses} onChange={(e) => update("expenses", Number(e.target.value))} /></Row>
        <Row><span>Cost of Sale</span><RightAlignedInput value={inputs.cos} onChange={(e) => update("cos", Number(e.target.value))} /></Row>
        <hr />
        <Row><b>= GCI:</b><b>{currency(calc.totalGci)}</b></Row>
        <Row><span>÷ Avg Commission</span><RightAlignedInput value={inputs.avgCommission} onChange={(e) => update("avgCommission", Number(e.target.value))} /></Row>
        <Row><b>= Units:</b><b>{calc.unitsNeeded}</b></Row>
      </Box>

      {/* Conversion Funnel */}
      <Box style={{ marginTop: 12 }}>
        <h3>Conversion Funnel (Units → Clients → Appointments)</h3>
        <Row><b>Units Sold Needed</b><b>{calc.unitsNeeded}</b></Row>

        <div style={{ marginTop: 12 }}>
          <b>Units Sold → Clients Signed</b>
          <Row><span>Conversion Rate (%)</span><RightAlignedInput value={inputs.signedToClosedPct} onChange={(e) => update("signedToClosedPct", Number(e.target.value))} /></Row>
          <Row><span>Clients Signed Needed</span><b>{calc.signedNeeded}</b></Row>
        </div>

        <div style={{ marginTop: 12 }}>
          <b>Clients Signed → Appointments Held</b>
          <Row><span>Conversion Rate (%)</span><RightAlignedInput value={inputs.heldToSignedPct} onChange={(e) => update("heldToSignedPct", Number(e.target.value))} /></Row>
          <Row><span>Appointments Held Needed</span><b>{calc.heldNeeded}</b></Row>
        </div>

        <p style={{ fontSize: 12, fontStyle: "italic", color: "#64748b", marginTop: 8 }}>
          Because the author of this tool doesn't know how to sell 0.67 homes, targets are rounded up to the next whole number for the sake of simplicity and productivity.
        </p>
      </Box>

      {/* Take Action Section */}
      <Box style={{ marginTop: 12 }}>
        <h3>Take Action!</h3>
        <Row><span>Appointments Needed (Annual)</span><b>{calc.heldNeeded}</b></Row>
        <Row><span>Appointments Needed per Week</span><b>{calc.appointmentsPerWeek}</b></Row>
        <Row><span>Vacation Weeks per Year</span><RightAlignedInput value={inputs.vacationWeeks} onChange={(e) => handleWeeksChange("vacationWeeks", e.target.value)} /></Row>
        <Row><span>Working Weeks per Year</span><RightAlignedInput value={inputs.workingWeeks} onChange={(e) => handleWeeksChange("workingWeeks", e.target.value)} /></Row>
        <Row><span>Working Days per Week</span><RightAlignedInput value={inputs.daysPerWeek} onChange={(e) => update("daysPerWeek", Number(e.target.value))} /></Row>
        <Row><span>Lead Generation Hours per Day</span><RightAlignedInput value={inputs.leadGenHoursPerDay} onChange={(e) => update("leadGenHoursPerDay", Number(e.target.value))} /></Row>
        <Row><span>Conversations per Hour</span><RightAlignedInput value={inputs.convosPerHour} onChange={(e) => update("convosPerHour", Number(e.target.value))} /></Row>
        <Row><span>Conversations to Secure One Appointment</span><RightAlignedInput value={inputs.convosPerAppt} onChange={(e) => update("convosPerAppt", Number(e.target.value))} /></Row>
        <Row><span>Weekly Conversation Goal</span><b>{calc.weeklyConversationGoal}/week</b></Row>
        <Row><span>Daily Conversation Goal</span><b>{calc.dailyConversationGoal}/day</b></Row>
        <Row><span>Your Current Capacity</span><b>{calc.feasibilityDailyCap}/day</b></Row>
        <Row>
          <span>Feasibility</span>
          <span style={{ color: calc.feasible ? "green" : "red" }}>
            {calc.feasible ? `OK (You're on track—protect that time!)` : `SHORT (Add 1 hour or tighten follow-up)`}
          </span>
        </Row>
      </Box>
    </div>
  );
}
