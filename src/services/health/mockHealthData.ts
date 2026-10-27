// Health Connect를 쓸 수 없는 환경(에뮬레이터 등)에서 리포트 UI를 확인하기 위한 목업 데이터

const hoursUntilNow = () => {
  const now = new Date();
  const hours: Date[] = [];

  for (let hour = 0; hour <= now.getHours(); hour++) {
    const time = new Date(now);
    time.setHours(hour, 0, 0, 0);
    hours.push(time);
  }

  return hours;
};

export const createMockHealthData = () => {
  const hours = hoursUntilNow();

  const heartRateSamples = hours.map((time, index) => ({
    time: time.toISOString(),
    bpm: 62 + Math.round(18 * Math.sin(index / 3)) + (index % 4) * 2,
  }));

  const bloodPressureSamples = hours
    .filter((_, index) => index % 3 === 0)
    .map((time, index) => ({
      time: time.toISOString(),
      systolic: 112 + (index % 3) * 6,
      diastolic: 72 + (index % 2) * 5,
    }));

  const oxygenSamples = hours
    .filter((_, index) => index % 2 === 0)
    .map(time => ({
      time: time.toISOString(),
      percentage: 97,
    }));

  const latestHeartRate = heartRateSamples[heartRateSamples.length - 1];
  const latestBloodPressure =
    bloodPressureSamples[bloodPressureSamples.length - 1];
  const latestOxygen = oxygenSamples[oxygenSamples.length - 1];

  const sleepEnd = new Date();
  sleepEnd.setHours(7, 10, 0, 0);
  const sleepStart = new Date(sleepEnd.getTime() - 412 * 60 * 1000);

  return {
    isMock: true,
    stepsTotal: 6342,

    latestHeartRate: latestHeartRate?.bpm ?? 0,
    latestHeartRateTime: latestHeartRate?.time,
    heartRateSamples,

    latestOxygen: latestOxygen?.percentage ?? 0,
    latestOxygenTime: latestOxygen?.time,
    oxygenSamples,

    latestSystolic: latestBloodPressure?.systolic ?? 0,
    latestDiastolic: latestBloodPressure?.diastolic ?? 0,
    latestBloodPressureTime: latestBloodPressure?.time,
    bloodPressureSamples,

    latestSleepMinutes: 412,
    latestSleepStartTime: sleepStart.toISOString(),
    latestSleepEndTime: sleepEnd.toISOString(),
    sleepSessions: [
      {
        startTime: sleepStart.toISOString(),
        endTime: sleepEnd.toISOString(),
        hours: 412 / 60,
      },
    ],
  };
};
