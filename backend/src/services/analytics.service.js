import Application from "../models/application.model.js";
import { APPLICATION_STAGES } from "../utils/constants.js";
import { toObjectId } from "../utils/object-id.js";
import { buildApplicationAccessFilter } from "./access-control.service.js";

function round(value) {
  return Math.round(value * 100) / 100;
}

function differenceInDays(startDate, endDate) {
  const milliseconds = new Date(endDate).getTime() - new Date(startDate).getTime();
  return milliseconds / (1000 * 60 * 60 * 24);
}

export async function getHiringAnalytics(query, actor) {
  const filter = await buildApplicationAccessFilter(actor);

  if (query.jobId) {
    filter.job = toObjectId(query.jobId, "jobId");
  }

  const applications = await Application.find(filter).populate([
    { path: "job", select: "title department" },
    { path: "candidate", select: "firstName lastName" }
  ]);

  const stageCounts = APPLICATION_STAGES.reduce((accumulator, stage) => {
    accumulator[stage] = 0;
    return accumulator;
  }, {});

  const stageReachedCounts = APPLICATION_STAGES.reduce((accumulator, stage) => {
    accumulator[stage] = 0;
    return accumulator;
  }, {});

  const hiredApplications = [];
  const perJob = new Map();

  for (const application of applications) {
    stageCounts[application.stage] = (stageCounts[application.stage] || 0) + 1;

    const visitedStages = new Set(
      (application.stageHistory || []).map((entry) => entry.stage)
    );
    visitedStages.add(application.stage);

    for (const stage of APPLICATION_STAGES) {
      if (visitedStages.has(stage)) {
        stageReachedCounts[stage] = (stageReachedCounts[stage] || 0) + 1;
      }
    }

    const jobKey = application.job?._id?.toString() || "unknown";

    if (!perJob.has(jobKey)) {
      perJob.set(jobKey, {
        jobId: jobKey,
        title: application.job?.title || "Unknown role",
        department: application.job?.department || "Unknown",
        applied: 0,
        hired: 0
      });
    }

    const jobEntry = perJob.get(jobKey);
    jobEntry.applied += 1;

    if (application.stage === "hired" || application.status === "hired") {
      jobEntry.hired += 1;

      const hiredAt =
        application.stageHistory?.find((entry) => entry.stage === "hired")?.changedAt ||
        application.updatedAt;

      hiredApplications.push({
        applicationId: application._id.toString(),
        candidateName: `${application.candidate?.firstName || ""} ${application.candidate?.lastName || ""}`.trim(),
        jobTitle: application.job?.title || "Unknown role",
        daysToHire: round(differenceInDays(application.appliedAt, hiredAt))
      });
    }
  }

  const funnel = APPLICATION_STAGES.map((stage) => ({
    stage,
    count: stageReachedCounts[stage] || 0
  }));

  const conversion = APPLICATION_STAGES.map((stage, index) => {
    if (index === 0) {
      return {
        stage,
        rate: applications.length ? 100 : 0
      };
    }

    const previousStage = APPLICATION_STAGES[index - 1];
    const previousValue = stageReachedCounts[previousStage] || 0;
    const currentValue = stageReachedCounts[stage] || 0;

    return {
      stage,
      rate: previousValue ? round((currentValue / previousValue) * 100) : 0
    };
  });

  const averageTimeToHire = hiredApplications.length
    ? round(
        hiredApplications.reduce((sum, item) => sum + item.daysToHire, 0) /
          hiredApplications.length
      )
    : 0;

  const totalApplications = applications.length;
  const hiredCount = hiredApplications.length;

  return {
    summary: {
      totalApplications,
      totalHires: hiredCount,
      averageTimeToHire,
      overallConversionRate: totalApplications
        ? round((hiredCount / totalApplications) * 100)
        : 0
    },
    funnel,
    conversion,
    currentStageBreakdown: APPLICATION_STAGES.map((stage) => ({
      stage,
      count: stageCounts[stage] || 0
    })),
    timeToHire: {
      averageDays: averageTimeToHire,
      hires: hiredApplications
    },
    perJobConversion: Array.from(perJob.values()).map((item) => ({
      ...item,
      conversionRate: item.applied ? round((item.hired / item.applied) * 100) : 0
    }))
  };
}
