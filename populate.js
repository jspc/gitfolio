const fs = require("fs");
const emoji = require("github-emoji");
const jsdom = require("jsdom").JSDOM,
      options = {
          resources: "usable"
      };
const { getConfig, outDir } = require("./utils");
const { getRepos, getUser } = require("./api");

async function buildHomePage(user, config, opts) {
    const includeFork = opts.includeFork;

    jsdom
        .fromFile(`${__dirname}/assets/index.html`, options)
        .then(async function(dom) {
            let window = dom.window,
                document = window.document;

            const repos = await getRepos(user, opts);

            for (var i = 0; i < repos.length; i++) {
                let element;

                if (repos[i].fork == false) {
                    element = document.getElementById("work_section");
                } else if (includeFork == true) {
                    document.getElementById("forks").style.display = "block";
                    element = document.getElementById("forks_section");
                } else {
                    continue;
                }

                element.innerHTML += `
                        <a href="${repos[i].html_url}" target="_blank">
                        <section>
                            <div class="section_title">${repos[i].full_name}</div>
                            <div class="about_section">
                            <span style="display:${
                              repos[i].description == undefined
                                ? "none"
                                : "block"
                            };">${convertToEmoji(repos[i].description)}</span>
                            </div>
                            <div class="bottom_section">
                                <span style="display:${
                                  repos[i].language == null
                                    ? "none"
                                    : "inline-block"
                                };"><i class="fas fa-code"></i>&nbsp; ${
              repos[i].language
            }</span>
                                <span><i class="fas fa-star"></i>&nbsp; ${
                                  repos[i].stargazers_count
                                }</span>
                                <span><i class="fas fa-code-branch"></i>&nbsp; ${
                                  repos[i].forks_count
                                }</span>
                            </div>
                        </section>
                        </a>`;
            }

            document.title = user.login;
            document = setUserSection(document, user, opts.socials, opts.cv, opts.fediverse);

            await fs.writeFile(
                `${outDir}/index.html`,
                "<!DOCTYPE html>" + window.document.documentElement.outerHTML,
                function(error) {
                    if (error) throw error;
                    console.log(`Build Complete, Files can be Found @ ${outDir}\n`);
                }
            );
        })
        .catch(function(error) {
            console.log(error);
            throw error;
        });
}

async function buildCVPage(user, config, opts) {
    jsdom
        .fromFile(`${__dirname}/assets/cv.html`, options)
        .then(async function(dom) {
            let window = dom.window,
                document = window.document;

            let element = document.getElementById("pdf_section");
            element.innerHTML = `<embed src="${opts.cv}" style="width: 100%; height: 100vh;" />`;

            document.title = `${user.login} CV`;
            document = setUserSection(document, user, opts.socials, opts.cv);

            await fs.writeFile(
                `${outDir}/cv.html`,
                "<!DOCTYPE html>" + window.document.documentElement.outerHTML,
                function(error) {
                    if (error) throw error;
                    console.log(`Build Complete, Files can be Found @ ${outDir}\n`);
                }
            );

            config[0].cv = opts.cv;
        })
        .catch(function(error) {
            console.log(error);
            throw error;
        });
}

async function populate(username, opts) {
    const user = await getUser(username);
    let config = await getConfig();

    if (opts.cv) {
        await buildCVPage(user, config, opts);
        config[0].cv = opts.cv;
    }

    await buildHomePage(user, config, opts);

    config[0].username = user.login;
    config[0].name = user.name;
    config[0].userimg = user.avatar_url;

    // Finalise config data
    await fs.writeFile(
        `${outDir}/config.json`,
        JSON.stringify(config, null, " "),
        function(err) {
            if (err) throw err;
            console.log("Config file updated.");
        }
    );
}

module.exports = {
    populate
};

function setUserSection(document, user, socials, cv, fedi) {
    var icon = document.createElement("link");
    icon.setAttribute("rel", "icon");
    icon.setAttribute("href", user.avatar_url);
    icon.setAttribute("type", "image/png");

    document.getElementsByTagName("head")[0].appendChild(icon);
    document.getElementById("profile_img" )
        .style.background = `url('${user.avatar_url}') center center`;

    document.getElementById("username")
        .innerHTML = `
<span style="display:${user.name == null || !user.name ? "none" : "block"};">
  <a href="/">${user.name}</a>
</span>
<a href="${user.html_url}">@${user.login}</a>`;

    document.getElementById("userbio").innerHTML = convertToEmoji(
        user.bio
    );

    document.getElementById("userbio").style.display =
        user.bio == null || !user.bio ? "none" : "block";

    document.getElementById("footer").innerHtml = `
<a href="https://github.com/jspc" target="_blank">made on earth by a human</a>
<a style="display:none" rel="me" href="${fedi}"></a>
`;

    document.getElementById("about").innerHTML = `
<span style="display:${user.company == null || !user.company ? "none" : "block"};">
   <i class="fas fa-users"></i> &nbsp; ${user.company}
</span>
<span style="display:${user.email == null || !user.email ? "none" : "block"};">
   <i class="fas fa-envelope"></i> &nbsp; ${user.email}
</span>
<span style="display:${user.blog == null || !user.blog ? "none" : "block"};">
   <i class="fas fa-link"></i> &nbsp; <a href="${user.blog}">${user.blog}</a>
</span>
<span style="display:${user.location == null || !user.location ? "none" : "block"};">
   <i class="fas fa-map-marker-alt"></i> &nbsp;&nbsp; ${user.location}
</span>
<span style="display:${user.hireable == false || !user.hireable ? "none" : "block"};">
   <i class="fas fa-user-tie"></i> &nbsp;&nbsp; Available for hire
</span>
<span style="display:${cv == null || !cv ? "none" : "block"};">
   <i class="fas fa-file"></i> &nbsp;&nbsp; <a href="/cv.html">My CV/ Resume</a>
</span>


<div class="socials">
  <span style="display:${socials.twitter == null ? "none !important" : "block"};">
    <a href="https://www.twitter.com/${socials.twitter}" target="_blank" class="socials"><i class="fab fa-twitter"></i></a>
  </span>
  <span style="display:${socials.dribbble == null ? "none !important" : "block"};">
    <a href="https://www.dribbble.com/${socials.dribbble}" target="_blank" class="socials"><i class="fab fa-dribbble"></i></a>
  </span>
  <span style="display:${socials.linkedin == null ? "none !important" : "block"};">
    <a href="https://www.linkedin.com/in/${socials.linkedin}/" target="_blank" class="socials"><i class="fab fa-linkedin-in"></i></a>
  </span>
  <span style="display:${socials.medium == null ? "none !important" : "block"};">
    <a href="https://www.medium.com/@${socials.medium}/" target="_blank" class="socials"><i class="fab fa-medium-m"></i></a>
  </span>
</div>
`;

    return document;
}

function convertToEmoji(text) {
    if (text == null) return;
    text = text.toString();
    var pattern = /(?<=:\s*).*?(?=\s*:)/gs;
    if (text.match(pattern) != null) {
        var str = text.match(pattern);
        str = str.filter(function(arr) {
            return /\S/.test(arr);
        });
        for (i = 0; i < str.length; i++) {
            if (emoji.URLS[str[i]] != undefined) {
                text = text.replace(
                    `:${str[i]}:`,
                    `<img src="${emoji.URLS[str[i]]}" class="emoji">`
                );
            }
        }
        return text;
    } else {
        return text;
    }
}
