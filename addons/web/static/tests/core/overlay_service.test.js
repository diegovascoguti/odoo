import { Component, mount, xml } from "@odoo/owl";
import { MainComponentsContainer } from "@web/core/main_components_container";
import { test, expect, getFixture, destroy, after } from "@odoo/hoot";
import { animationFrame } from "@odoo/hoot-mock";
import { mountWithCleanup, getService, makeMockEnv } from "@web/../tests/web_test_helpers";
import { getTemplate } from "@web/core/templates";

test("simple case", async () => {
    await mountWithCleanup(MainComponentsContainer);
    expect(".o-overlay-container").toHaveCount(1);

    class MyComp extends Component {
        static template = xml`
            <div class="overlayed"></div>
        `;
        static props = ["*"];
    }

    const remove = getService("overlay").add(MyComp, {});
    await animationFrame();
    expect(".o-overlay-container > .overlayed").toHaveCount(1);

    remove();
    await animationFrame();
    expect(".o-overlay-container > .overlayed").toHaveCount(0);
});

test("shadow DOM overlays are visible when registered before main component is mounted", async () => {
    let app, root;
    after(() => {
        if (app) {
            destroy(app);
        }
        root?.remove();
    });
    class MyComp extends Component {
        static template = xml`
            <div class="overlayed"></div>
        `;
        static props = ["*"];
    }
    const env = await makeMockEnv();
    root = document.createElement("div");
    getFixture().append(root);
    root.setAttribute("id", "my-root-id");
    getService("overlay").add(MyComp, undefined, { rootId: "my-root-id" });
    const shadow = root.attachShadow({ mode: "open" });
    app = await mount(MainComponentsContainer, shadow, { env, getTemplate });
    await animationFrame();
    expect("#my-root-id:shadow .o-overlay-container > .overlayed").toHaveCount(1);
});

test("onRemove callback", async () => {
    await mountWithCleanup(MainComponentsContainer);
    class MyComp extends Component {
        static template = xml``;
        static props = ["*"];
    }

    const onRemove = () => expect.step("onRemove");
    const remove = getService("overlay").add(MyComp, {}, { onRemove });

    expect.verifySteps([]);
    remove();
    expect.verifySteps(["onRemove"]);
});

test("multiple overlays", async () => {
    await mountWithCleanup(MainComponentsContainer);
    class MyComp extends Component {
        static template = xml`
            <div class="overlayed" t-att-class="props.className"></div>
        `;
        static props = ["*"];
    }

    const remove1 = getService("overlay").add(MyComp, { className: "o1" });
    const remove2 = getService("overlay").add(MyComp, { className: "o2" });
    const remove3 = getService("overlay").add(MyComp, { className: "o3" });
    await animationFrame();
    expect(".overlayed").toHaveCount(3);
    expect(".overlayed:nth-child(1)").toHaveClass("o1");
    expect(".overlayed:nth-child(2)").toHaveClass("o2");
    expect(".overlayed:nth-child(3)").toHaveClass("o3");

    remove1();
    await animationFrame();
    expect(".overlayed").toHaveCount(2);
    expect(".overlayed:nth-child(1)").toHaveClass("o2");
    expect(".overlayed:nth-child(2)").toHaveClass("o3");

    remove2();
    await animationFrame();
    expect(".overlayed").toHaveCount(1);
    expect(".overlayed:nth-child(1)").toHaveClass("o3");

    remove3();
    await animationFrame();
    expect(".overlayed").toHaveCount(0);
});

test("sequence", async () => {
    await mountWithCleanup(MainComponentsContainer);
    class MyComp extends Component {
        static template = xml`
            <div class="overlayed" t-att-class="props.className"></div>
        `;
        static props = ["*"];
    }

    const remove1 = getService("overlay").add(MyComp, { className: "o1" }, { sequence: 50 });
    const remove2 = getService("overlay").add(MyComp, { className: "o2" }, { sequence: 60 });
    const remove3 = getService("overlay").add(MyComp, { className: "o3" }, { sequence: 40 });
    await animationFrame();
    expect(".overlayed").toHaveCount(3);
    expect(".overlayed:nth-child(1)").toHaveClass("o3");
    expect(".overlayed:nth-child(2)").toHaveClass("o1");
    expect(".overlayed:nth-child(3)").toHaveClass("o2");

    remove1();
    await animationFrame();
    expect(".overlayed").toHaveCount(2);
    expect(".overlayed:nth-child(1)").toHaveClass("o3");
    expect(".overlayed:nth-child(2)").toHaveClass("o2");

    remove2();
    await animationFrame();
    expect(".overlayed").toHaveCount(1);
    expect(".overlayed:nth-child(1)").toHaveClass("o3");

    remove3();
    await animationFrame();
    expect(".overlayed").toHaveCount(0);
});
