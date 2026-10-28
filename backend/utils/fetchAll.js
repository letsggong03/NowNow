const PAGE_SIZE = 1000;

// Supabase는 한 번에 최대 1000행만 돌려주므로 끝까지 나눠서 읽는다.
// buildQuery는 호출할 때마다 새 쿼리를 만들어야 한다.
async function fetchAll(buildQuery) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);

    if (error) {
      const failure = new Error(error.message);
      failure.code = error.code;
      failure.details = error.details;
      throw failure;
    }

    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

module.exports = fetchAll;
