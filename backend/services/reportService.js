const supabase = require("../config/supabase");

async function createReport(reportData) {
  const { data, error } = await supabase
    .from("health_reports")
    .insert([
      {
        user_id: reportData.user_id,
        heart_rate: reportData.heart_rate,
        systolic_bp: reportData.systolic_bp,
        diastolic_bp: reportData.diastolic_bp,
        measured_at: reportData.measured_at
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getReportsByUser(user_id) {
  const { data, error } = await supabase
    .from("health_reports")
    .select("*")
    .eq("user_id", user_id)
    .order("measured_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getReportById(health_record_id) {
  const { data, error } = await supabase
    .from("health_reports")
    .select("*")
    .eq("health_record_id", health_record_id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function deleteReport(health_record_id, user_id) {
  const { error } = await supabase
    .from("health_reports")
    .delete()
    .eq("health_record_id", health_record_id)
    .eq("user_id", user_id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

module.exports = {
  createReport,
  getReportsByUser,
  getReportById,
  deleteReport
};