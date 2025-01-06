// request-pr-review
// Fetch and log PR approval requests

const core = require("@actions/core");
const axios = require("axios");

const authFetch = url => axios({
    method: "get",
    headers: {
        Authorization: 'token ${core.getInput("token")}'
    },
    url
}).then(res => res.data);

const refineToApiUrl = repoUrl => {
    const enterprise = !repoUrl.includes("github.com");
    const [host, pathname] = repoUrl
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .split(/\/(.*)/);

    if (enterprise) {
        return 'https://${host}/api/v3/repos/${pathname}';
    }

    return 'https://api.${host}/repos/${pathname}';
};

(async () => {
    try {
        const BASE_API_URL = refineToApiUrl(core.getInput("repoUrl"));
        core.info('Running for: ${BASE_API_URL}');

        // Fetch pull requests
        const fetchPulls = () => authFetch('${BASE_API_URL}/pulls');
        const fetchReviewers = number => authFetch('${BASE_API_URL}/pulls/${number}/requested_reviewers')
            .then(({ users }) => users);

        core.info("Fetching pulls...");
        const pulls = await fetchPulls();

        for (const pullInfo of pulls) {
            const { title, number, html_url } = pullInfo;
            core.info('PR #${number}: ${title} (${html_url})');

            core.info("Fetching reviewers for PR #${number}...");
            const reviewers = await fetchReviewers(number);

            reviewers.forEach(reviewer => {
                core.info('Reviewer: ${reviewer.login} (${reviewer.url})');
            });
        }

        core.info("Fetched all pull request and reviewer information successfully.");
    } catch (e) {
        core.setFailed('Error: ${e.message}');
    }
})();