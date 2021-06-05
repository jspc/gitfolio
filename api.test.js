const {getRepos} = require('./api');

const got = require("got");
jest.mock('got');

it('sorts repos by date correctly', () => {
    got.mockResolvedValue({
        body: `[
                {"full_name": "test/test-1", "created_at": "2017-10-05T16:40:27Z"},
                {"full_name": "test/test-2", "created_at": "2016-12-06T17:31:41Z"},
                {"full_name": "test/test-7", "created_at": "2021-02-03T08:54:42Z"},
                {"full_name": "test/test-3", "created_at": "2018-07-22T17:47:58Z"},
                {"full_name": "test/test-4", "created_at": "2021-05-03T05:41:29Z"},
                {"full_name": "test/test-5", "created_at": "2015-12-22T17:06:38Z"},
                {"full_name": "test/test-6", "created_at": "2021-01-15T05:23:48Z"},
                {"full_name": "test/test-7", "created_at": "2021-02-03T08:54:42Z"},
                {"full_name": "test/test-7", "created_at": "2021-02-03T08:54:42Z"}
            ]`
    });

    expect.assertions(1);
    return getRepos("test", {order: "asc", sort: "created_at", orgs: true}).then(repos => expect(repos).toStrictEqual(
        [
            {full_name: "test/test-5", created_at: "2015-12-22T17:06:38Z"},
            {full_name: "test/test-2", created_at: "2016-12-06T17:31:41Z"},
            {full_name: "test/test-1", created_at: "2017-10-05T16:40:27Z"},
            {full_name: "test/test-3", created_at: "2018-07-22T17:47:58Z"},
            {full_name: "test/test-6", created_at: "2021-01-15T05:23:48Z"},
            {full_name: "test/test-7", created_at: "2021-02-03T08:54:42Z"},
            {full_name: "test/test-4", created_at: "2021-05-03T05:41:29Z"}
        ]
    ));
});
