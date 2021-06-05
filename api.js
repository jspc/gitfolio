const got = require("got");

/**
 * The defaults here are the same as the API
 * @see https://developer.github.com/v3/repos/#list-user-repositories
 * @param {string} username
 * @param {Object} opts
 * @param {('all' | 'owner' | 'member')[]} [opts.types]
 * @param {'created' | 'updated' | 'pushed' | 'full_name' | 'star'} [opts.sort]
 * @param {'desc' | 'asc'} [opts.order]
 */
async function getRepos(user, opts = {}) {
    const sort = opts.sort;
    const order = opts.order;
    const repositories = opts.repositories;

    var repos = await repoLoop(genUrl(user.repos_url, opts), repositories, sort);
    if (opts.orgs) {
        orgs = await got(user.organizations_url);
        orgs = JSON.parse(orgs.body);

        for (var i = 0; i < orgs.length; i++) {
            orgRepos = await repoLoop(genUrl(orgs[i].repos_url, opts), repositories, sort);
            repos = repos.concat(orgRepos);
        }
    }

    let names = repos.map(o => o.full_name)
    repos = repos.filter(({full_name}, index) => !names.includes(full_name, index + 1))

    repos = repos.sort(function(a, b) {
        let aMetric = sortValue(a, sort);
        let bMetric = sortValue(b, sort);

        if (aMetric === bMetric) { return 0 }

        if (order == "desc") {
            return aMetric > bMetric ? 1 : -1;
        } else {
            return aMetric < bMetric ? 1 : -1;
        }
    });

    return repos;
}

function sortValue(repo, sort) {
    switch(sort) {
    case "star":
        return repo.stargzers_count;
        break;

    case "full_name":
    case "name":
        return repo.full_name;
        break;

    case "updated_at":
    case "updated":
        return Date.parse(repo.updated_at);
        break;

    case "pushed_at":
        return Date.parse(repo.pushed_at);
        break
    }

    return Date.parse(repo.created_at);
}

function genUrl(urlBase, opts) {
    const sort = opts.sort;
    const order = opts.order || (sort === "full_name" ? "asc" : "desc");
    const types = opts.types || [];

    let type = "all";

    if (
        types.includes("all") ||
            (types.includes("owner") && types.includes("member"))
    ) {
        type = "all";
    } else if (types.includes("member")) {
        type = "member";
    }

    let u = `${urlBase}?per_page=100&type=${type}`;
    if (sort && sort !== "star") {
        u += `&sort=${sort}&direction=${order}`;
    }

    return u;
}

async function repoLoop(urlBase, repositories, sort) {
    let tempRepos = [];
    let page = 1;
    let repos = [];

    do {
        let requestUrl = `${urlBase}&page=${page++}`;

        tempRepos = await got(requestUrl);
        tempRepos = JSON.parse(tempRepos.body);

        if (repositories && repositories.length > 0) {
            repos = repos.concat(tempRepos.filter(r => (repositories.includes(r.name) || repositories.includes(r.full_name))));
        } else {
            repos = repos.concat(tempRepos);
        }
    } while (tempRepos.length == 100);

    return repos;
}

/**
 * @see https://developer.github.com/v3/users/#get-a-single-user
 * @param {string} username
 */
async function getUser(username) {
    const res = await got(`https://api.github.com/users/${username}`);
    return JSON.parse(res.body);
}

module.exports = {
    getRepos,
    getUser
};
