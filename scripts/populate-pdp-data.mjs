import fs from 'node:fs/promises';

const shop = process.env.SHOPIFY_STORE;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-07';
const apply = process.argv.includes('--apply');

if (!shop || !clientId || !clientSecret) throw new Error('SHOPIFY_STORE, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required.');

const oauth = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
});
if (!oauth.ok) throw new Error(`Shopify OAuth failed (${oauth.status}).`);
const { access_token: token } = await oauth.json();

async function gql(query, variables = {}, label = 'GraphQL operation') {
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(`${label}: ${JSON.stringify(payload.errors || payload)}`);
  const mutationRoot = Object.values(payload.data || {}).find((value) => value?.userErrors);
  if (mutationRoot?.userErrors?.length) throw new Error(`${label}: ${JSON.stringify(mutationRoot.userErrors)}`);
  return payload.data;
}

const state = await gql(`#graphql
  query PdpPopulationState {
    shop { id metafields(first: 100) { nodes { id namespace key type value } } }
    products(first: 100, query: "status:active", sortKey: TITLE) {
      nodes {
        id title handle status productType templateSuffix tags descriptionHtml
        options { name optionValues { name } }
        variants(first: 100) { nodes { id title price compareAtPrice availableForSale } }
        media(first: 100) { nodes { id mediaContentType alt preview { image { url width height altText } } } }
        collections(first: 20) { nodes { id handle title } }
        metafields(first: 250) { nodes { id namespace key type value } }
      }
    }
    metafieldDefinitions(first: 250, ownerType: PRODUCT) { nodes { id namespace key type { name } validations { name value } } }
    metaobjectDefinitions(first: 100) { nodes { id type name fieldDefinitions { key type { name } } } }
  }
`, {}, 'Read population state');

const productMap = new Map(state.products.nodes.map((product) => [product.handle, product]));
const media = (product, index) => product.media.nodes[index]?.id;
const relatedIds = (...handles) => handles.map((handle) => productMap.get(handle)?.id).filter(Boolean);
const disclaimer = 'This product is not intended to diagnose, treat, cure, or prevent any disease. If you have a medical condition, injury, circulation concern, or persistent symptoms, consult a qualified healthcare professional before use.';

const plans = {
  'adjustable-bunion-corrector': (p) => ({
    eyebrow: 'Adjustable toe positioning support',
    headline: 'Make Your Foot-Care Routine Feel More Manageable.',
    subheadline: 'A strap-secured corrector with a rotating adjustment knob for controlled big-toe positioning support at home.',
    identity: ['Shoes feel crowded around your big toe.', 'You prefer adjustable tension over a fixed spacer.', 'You need a left, right, or reversible fit option.'],
    painHeading: 'Does this feel familiar?', painIntro: 'Small fit and pressure frustrations can shape the way you plan your day.',
    pain: [
      ['Pressure around the big toe', 'Crowded footwear can make the area feel harder to ignore.', 0],
      ['Fixed support feels limiting', 'You want to control the angle instead of accepting one setting.', 1],
      ['Side selection feels confusing', 'Clear left, right, and reversible options make choosing easier.', 7],
      ['Your routine needs flexibility', 'You want support you can adjust gradually at home.', 3],
    ],
    reassurance: 'If these moments sound familiar, a clearer and more adjustable routine may help you feel more in control.',
    videoHeading: 'See how adjustable support fits into a simple routine.', videoText: 'Use the demonstration as a layout guide, then follow the fit and safety directions supplied with your product.',
    outcomes: [['Controlled adjustment', 'Turn the knob gradually.'], ['Secure fit', 'Elastic straps hold the device in place.'], ['Side options', 'Choose the variant that matches your foot.'], ['At-home routine', 'Start gently and check comfort often.']],
    howHeading: 'How it works', howIntro: 'Simple, adjustable, and easy to check as you go.',
    steps: [['Put it on', 'Place the support over the selected foot and position the big-toe contact point.', 2], ['Secure the straps', 'Fasten the elastic straps so the device sits steadily without restricting circulation.', 3], ['Adjust gradually', 'Turn the knob in small increments and stop if you feel pain, numbness, or tingling.', 1]],
    usageTip: 'Begin with gentle tension and a short session. Comfort—not maximum adjustment—is the guide.',
    lifestyleHeading: 'Back to the moments you want to enjoy', lifestyleIntro: 'Support should fit around real life, not become the center of it.',
    lifestyle: [['A calmer morning routine', 'Set the fit before the day gets busy.', 2], ['Time at home', 'Use the device where you can check comfort easily.', 3], ['A better-informed shoe choice', 'Leave enough room to avoid added pressure.', 6], ['A routine you control', 'Adjust gradually rather than forcing the position.', 1]],
    routineHeading: 'Build a foot-care routine that fits your day', related: relatedIds('breathable-bunion-support', 'day-night-bunion-corrector', 'rotating-toe-alignment-support'),
    usage: 'Choose the correct left, right, or reversible variant. Secure the straps comfortably, then turn the adjustment knob in small increments. Begin with a short session and check your skin and circulation regularly.',
    safety: 'Do not overtighten. Stop use if you experience pain, numbness, tingling, skin irritation, color change, or worsening discomfort.', disclaimer,
    faq: [['How do I choose a side?', 'Select the left-foot, right-foot, or reversible option shown in the variant selector. Confirm the selected variant before adding it to your cart.'], ['How tightly should I turn the knob?', 'Use only gentle tension. Make small adjustments and stop immediately if you feel pain, numbness, tingling, or restricted circulation.'], ['Can I wear it inside shoes?', 'Only do so when your footwear has enough room for the device without added pressure or rubbing. The product images primarily show an at-home support device.'], ['How long should a first session be?', 'Start with a short session and increase only when the fit remains comfortable. Follow any instructions included with your product.'], ['What if the fit feels wrong?', 'Remove the device, confirm that the straps and side selection are correct, and contact support if you need help choosing a variant.']],
    compatibilityHeading: 'Choose the fit that matches your routine', compatibility: [['Reversible option', 'Designed for left- or right-foot use.'], ['Left-foot option', 'A dedicated left-side configuration.'], ['Right-foot option', 'A dedicated right-side configuration.']], cta: 'Start Your Foot-Care Routine', howImage: media(p, 2),
  }),
  'rotating-toe-alignment-support': (p) => ({
    eyebrow: 'Rotating adjustment support', headline: 'Choose the Angle. Keep the Routine Gentle.',
    subheadline: 'A strap-secured toe support with a rotating adjustment knob and left, right, or reversible variant options.',
    identity: ['You want adjustable toe positioning support.', 'You prefer clear left- and right-side choices.', 'You plan to use the device as part of an at-home routine.'],
    painHeading: 'Does this feel familiar?', painIntro: 'The right support begins with a fit you can understand and adjust.',
    pain: [['One angle does not suit every foot', 'The rotating knob lets you make small fit changes.', 1], ['Straps can feel hard to position', 'The product uses elastic straps to hold the support in place.', 3], ['Left and right options get confusing', 'Each variant states which side it is intended to fit.', 7], ['Too much tension defeats the purpose', 'A gradual approach keeps comfort at the center.', 5]],
    reassurance: 'A thoughtful routine is about controlled fit and regular comfort checks—not forcing a result.',
    videoHeading: 'See the adjustment routine before you begin.', videoText: 'Use this general demonstration alongside the product images and included instructions.',
    outcomes: [['Rotating control', 'Adjust in small increments.'], ['Elastic straps', 'Secure the device around the foot.'], ['Side selection', 'Choose left, right, or reversible.'], ['One-size listing', 'Fit is adjusted with the straps.']],
    howHeading: 'How it works', howIntro: 'Position, secure, then adjust slowly.',
    steps: [['Position the support', 'Place the device on the selected foot with the contact pad at the big toe.', 2], ['Fasten the straps', 'Secure the elastic straps so the device sits steadily.', 3], ['Turn the knob gently', 'Use small adjustments and stop if the fit becomes uncomfortable.', 1]],
    usageTip: 'Recheck the fit after every adjustment and never continue through numbness or pain.',
    lifestyleHeading: 'A more considered at-home routine', lifestyleIntro: 'Keep the process simple and make room for regular comfort checks.',
    lifestyle: [['Set up without rushing', 'Take time to place the straps correctly.', 2], ['Adjust in small steps', 'Avoid making a large change all at once.', 1], ['Check both fit and skin', 'Remove the device if pressure becomes uncomfortable.', 4], ['Store it ready for next time', 'Keep the straps open and the device clean between uses.', 6]],
    routineHeading: 'Compare toe-support options', related: relatedIds('adjustable-bunion-corrector', 'breathable-bunion-support', 'day-night-bunion-corrector'),
    usage: 'Choose the side-specific or reversible variant, position the device, fasten the elastic straps, and turn the knob gradually. Use only while the fit remains comfortable.',
    safety: 'Do not overtighten or continue through pain, numbness, tingling, irritation, color change, or restricted circulation.', disclaimer,
    faq: [['What does the rotating knob do?', 'It changes the support angle. Turn it only in small increments and use gentle tension.'], ['Which side should I order?', 'Choose the reversible, left-foot, or right-foot variant shown in the selector.'], ['Is this a one-size product?', 'The supplier listing describes it as one size with adjustable elastic straps. Individual fit can still vary.'], ['Can I use it while walking?', 'The product information supports positioning and fixation use but does not confirm suitability for walking in every shoe. Use it only where the device fits without pressure.'], ['When should I stop using it?', 'Remove it immediately if you notice pain, numbness, tingling, skin irritation, color change, or worsening discomfort.']],
    compatibilityHeading: 'Side and fit options', compatibility: [['Reversible', 'For left- or right-foot positioning.'], ['Left only', 'Dedicated left-foot configuration.'], ['Right only', 'Dedicated right-foot configuration.']], cta: 'Choose Your Support', howImage: media(p, 2),
  }),
  'breathable-bunion-support': (p) => ({
    eyebrow: 'Soft-shell toe support', headline: 'A Lighter, Simpler Way to Add Toe Support.',
    subheadline: 'A gray soft-shell support with breathable openings, adjustable straps, and cushioned contact areas.',
    identity: ['You prefer a soft-shell design.', 'Breathability matters in your routine.', 'You want a single adjustable gray option.'],
    painHeading: 'Does this feel familiar?', painIntro: 'Sometimes the best routine is the one that feels simple enough to repeat.',
    pain: [['Rigid devices feel like too much', 'A soft-shell build may feel easier to introduce gradually.', 0], ['Heat and bulk are distracting', 'Breathable openings help keep the design lighter.', 2], ['Complicated setup gets skipped', 'The strap-based design keeps the process straightforward.', 1], ['You need a gentler contact area', 'Cushioned product surfaces sit against the foot and toe.', 3]],
    reassurance: 'You do not need to force a fit. Start gently, check comfort, and let a repeatable routine do the work.',
    videoHeading: 'See the basic fit before your first session.', videoText: 'This shared demonstration shows the routine format; product images provide the exact fit details for this model.',
    outcomes: [['Soft shell', 'Flexible product construction.'], ['Breathable openings', 'Designed with ventilated areas.'], ['Adjustable straps', 'Fine-tune how it sits.'], ['Gray finish', 'One listed color option.']],
    howHeading: 'How it works', howIntro: 'A simple three-step fit check.',
    steps: [['Place it carefully', 'Position the contact areas around the big toe and side of the foot.', 0], ['Fasten the straps', 'Secure the support without restricting circulation.', 1], ['Check the fit', 'Make sure the device feels steady and remove it if discomfort increases.', 3]],
    usageTip: 'A secure fit should not feel tight, numb, or painful.',
    lifestyleHeading: 'Keep the routine simple', lifestyleIntro: 'Easy setup makes it easier to pause, check, and adjust.',
    lifestyle: [['Before a quiet evening', 'Fit the device when you have time to check comfort.', 0], ['A gradual first session', 'Start briefly instead of wearing it for an unverified duration.', 1], ['A breathable option', 'Use the open design as part of an at-home routine.', 2], ['Ready for the next use', 'Keep the support clean and dry between sessions.', 4]],
    routineHeading: 'Explore adjustable toe-support options', related: relatedIds('adjustable-bunion-corrector', 'rotating-toe-alignment-support', 'day-night-bunion-corrector'),
    usage: 'Position the support as shown in the product images, secure the straps without restricting circulation, and begin with a short, comfortable session.',
    safety: 'Stop use if you experience pain, numbness, tingling, irritation, color change, or worsening discomfort. Do not use on broken or irritated skin.', disclaimer,
    faq: [['What color is available?', 'The current product listing offers one gray variant.'], ['Is the shell rigid?', 'The supplier description identifies this product as a soft-shell design.'], ['How should the straps feel?', 'They should hold the support in place without causing numbness, pain, color change, or restricted circulation.'], ['Can I wear it for a full day?', 'No verified wear-time guidance is stored for this product. Begin with a short session and follow the included instructions.'], ['How do I care for it?', 'No verified cleaning method is stored. Follow the care directions supplied with the product and allow it to dry fully before reuse.']],
    compatibilityHeading: 'What to know before ordering', compatibility: [['Gray option', 'The listing currently has one color.'], ['Adjustable fit', 'Straps control how the shell sits.'], ['Soft-shell design', 'Supplier-listed flexible construction.']], cta: 'Add Soft-Shell Support', howImage: media(p, 1),
  }),
  'day-night-bunion-corrector': (p) => ({
    eyebrow: 'Day and night toe support', headline: 'One Adjustable Support for Different Parts of Your Day.',
    subheadline: 'A left-or-right wearable toe support with a rotating control, elastic strap fixation, and one- or two-piece color options.',
    identity: ['You want one design for day or night routines.', 'You need a product that can fit either foot.', 'You want to choose one or two pieces.'],
    painHeading: 'Does this feel familiar?', painIntro: 'Your routine changes through the day, so clarity about fit and quantity matters.',
    pain: [['Your schedule is not one-size-fits-all', 'The product is listed for day or night use.', 0], ['You need either-foot flexibility', 'The listing describes universal left- or right-foot use.', 2], ['Quantity labels are easy to miss', 'Variants clearly separate one-piece and two-piece options.', 7], ['Adjustment needs to stay controlled', 'The rotating control should be changed gradually.', 1]],
    reassurance: 'Choose the quantity and color you actually need, then keep every adjustment gentle and easy to reverse.',
    videoHeading: 'See the routine, then match it to your selected model.', videoText: 'Use the product images for the exact strap path and the included instructions for wear guidance.',
    outcomes: [['Either-foot fit', 'Listed for left or right use.'], ['Rotating control', 'Flexible angle adjustment.'], ['Elastic fixation', 'Hook-and-loop strap setup.'], ['Quantity choices', 'One- and two-piece variants.']],
    howHeading: 'How it works', howIntro: 'Fit, secure, and adjust with care.',
    steps: [['Place it on either foot', 'Position the support around the foot and big toe.', 2], ['Secure the strap', 'Fasten the hook-and-loop strap so it feels steady but not tight.', 4], ['Adjust the angle', 'Rotate the control gradually and stop if the fit becomes uncomfortable.', 1]],
    usageTip: 'Check the full variant name before ordering so color and quantity match your plan.',
    lifestyleHeading: 'Support that follows your routine', lifestyleIntro: 'The product is listed for both daytime and nighttime use; comfort should decide when a session ends.',
    lifestyle: [['A daytime check-in', 'Use only where the device fits without added pressure.', 0], ['A quieter evening routine', 'Take time to position each contact point.', 4], ['One support or a pair', 'Choose the quantity before adding to cart.', 7], ['Either-foot flexibility', 'Fit the device to the side you plan to support.', 2]],
    routineHeading: 'Compare toe-support styles', related: relatedIds('adjustable-bunion-corrector', 'breathable-bunion-support', 'rotating-toe-alignment-support'),
    usage: 'Position the device on either foot, fasten the hook-and-loop strap, then rotate the control gradually. Follow the instructions supplied with your selected variant.',
    safety: 'Do not overtighten or sleep in the device if the fit causes pressure, pain, numbness, tingling, irritation, or restricted circulation.', disclaimer,
    faq: [['Can it fit either foot?', 'The supplier listing describes the device as universal for left- or right-foot use.'], ['What do 1PCS and 2PCS mean?', 'They indicate whether the selected variant contains one piece or two pieces. Check the full color-and-quantity label before ordering.'], ['Is day and night use guaranteed to feel the same?', 'No. Comfort can change with position, activity, and session length. Remove the device whenever the fit becomes uncomfortable.'], ['How should I adjust the control?', 'Rotate it in small increments and use only gentle tension.'], ['Can I walk in it?', 'The stored product information does not confirm compatibility with every shoe or activity. Use only where it fits without pressure and follow the included instructions.']],
    compatibilityHeading: 'Color and quantity options', compatibility: [['White · 1 piece', 'One white support.'], ['Blue · 1 piece', 'One lake-blue support.'], ['White · 2 pieces', 'Two white supports.'], ['Blue · 2 pieces', 'Two lake-blue supports.']], cta: 'Choose Color & Quantity', howImage: media(p, 4),
  }),
  'ankle-support-side-stabilizers': (p) => ({
    eyebrow: 'Adjustable ankle support', headline: 'Add Structured Support Without Guessing at the Fit.',
    subheadline: 'A nylon ankle brace with side stabilizers, cross-binding straps, and size and color options for a more secure setup.',
    identity: ['You want side-to-side ankle support.', 'You need an adjustable cross-strap fit.', 'You prefer a clear S–XL size range.'],
    painHeading: 'Does this feel familiar?', painIntro: 'A brace only helps your routine when the size, strap path, and footwear all work together.',
    pain: [['Soft sleeves feel too unstructured', 'This design includes stabilizers at the sides.', 0], ['Straps loosen during your routine', 'Cross-binding straps wrap around the ankle.', 4], ['Sizing charts feel easy to skip', 'The listing includes S, M, L, and XL options.', 5], ['A bulky brace limits shoe choices', 'Product imagery shows the brace with footwear for fit context.', 3]],
    reassurance: 'The goal is a stable, comfortable fit—not the tightest fit you can create.',
    videoHeading: 'See how a support routine can stay simple.', videoText: 'Use this general demonstration for pacing, then follow the product images for the ankle-specific strap path.',
    outcomes: [['Side stabilizers', 'Structured support at the ankle.'], ['Cross straps', 'Adjustable wraparound fit.'], ['Breathable mesh', 'Open-mesh fabric shown in product details.'], ['Two colors', 'Black and gray options.']],
    howHeading: 'How it works', howIntro: 'Select your size before you tighten a strap.',
    steps: [['Choose the size', 'Use the supplier size chart shown in the product media and select S, M, L, or XL.', 5], ['Position the brace', 'Center the brace around the ankle before wrapping the straps.', 1], ['Cross and secure', 'Wrap the straps as shown and adjust until supportive without restricting circulation.', 4]],
    usageTip: 'If you plan to wear the brace with shoes, check that the footwear has enough room before extended use.',
    lifestyleHeading: 'Support for an active routine', lifestyleIntro: 'A more secure ankle setup can make everyday movement feel less distracting.',
    lifestyle: [['Before you head out', 'Set the brace before putting on your shoe.', 3], ['During activity', 'Recheck the straps if the fit shifts.', 0], ['After movement', 'Remove the brace and check the skin for pressure points.', 1], ['Ready for next time', 'Keep the hook-and-loop surfaces clean and closed.', 6]],
    routineHeading: 'Complete your support routine', related: relatedIds('plantar-fasciitis-night-splint-sock', 'electric-foot-hand-massager'),
    usage: 'Select the correct size, center the brace around the ankle, then wrap and secure the cross-binding straps as shown in the product images. Adjust for support without restricted circulation.',
    safety: 'Stop use if the brace causes pain, numbness, tingling, swelling, skin irritation, color change, or reduced circulation. Do not use the brace to continue an activity that worsens an injury.', disclaimer,
    faq: [['Which sizes are available?', 'The listing currently offers S, M, L, and XL. Use the size chart in the product images before selecting a variant.'], ['Which colors are available?', 'The current variants include gray (AB180-GY) and black (AB180-BK).'], ['Can it fit inside a shoe?', 'Product imagery shows in-shoe use, but compatibility depends on your shoe volume and selected brace size. Do not force a tight fit.'], ['How tight should the cross straps be?', 'Secure enough to hold the brace in place, but never tight enough to cause pain, numbness, tingling, color change, or restricted circulation.'], ['What material is listed?', 'The supplier description lists nylon.']],
    compatibilityHeading: 'Size and color choices', compatibility: [['S', 'Small size option.'], ['M', 'Medium size option.'], ['L', 'Large size option.'], ['XL', 'Extra-large size option.'], ['Black or gray', 'Two listed color codes.']], cta: 'Choose Your Size', howImage: media(p, 1),
  }),
  'plantar-fasciitis-night-splint-sock': (p) => ({
    eyebrow: 'Overnight foot support', headline: 'Set Up a More Supported Position Before You Sleep.',
    subheadline: 'A fabric night splint sock with adjustable straps, an above-ankle fit, and three listed sizes for overnight foot positioning support.',
    identity: ['Mornings make you think about heel or foot tension.', 'You want support designed for a nighttime routine.', 'You need a lightweight fabric option in S, M, or L.'],
    painHeading: 'Does this feel familiar?', painIntro: 'Nighttime support should feel secure enough to hold its position and comfortable enough to rest in.',
    pain: [['Your foot relaxes out of position', 'The strap system is designed to maintain a supported angle.', 0], ['Rigid splints feel too bulky', 'This model uses a lightweight fabric construction.', 4], ['One size does not feel reliable', 'The listing provides S, M, and L variants.', 2], ['Straps can create pressure points', 'A gradual fit check matters before you settle in.', 1]],
    reassurance: 'A better overnight setup begins with the right size, gentle strap tension, and permission to stop if the fit feels wrong.',
    videoHeading: 'See the setup before making it part of bedtime.', videoText: 'Use the product images for the exact strap route and the included directions for overnight wear.',
    outcomes: [['Nighttime design', 'Listed for sleeping routines.'], ['Fabric construction', 'Soft, lightweight upper material.'], ['Adjustable straps', 'Control the supported position.'], ['Three sizes', 'S, M, and L options.']],
    howHeading: 'How it works', howIntro: 'Set the sock, route the strap, and check comfort before sleep.',
    steps: [['Choose the size', 'Select S, M, or L using the product information available with your order.', 2], ['Fit the sock', 'Place the support around the foot and ankle as shown.', 0], ['Adjust the tension strap', 'Pull only until the foot is supported without pain, numbness, or tingling.', 1]],
    usageTip: 'Test the fit while awake before using it as part of an overnight routine.',
    lifestyleHeading: 'A calmer way to prepare for rest', lifestyleIntro: 'A consistent setup can make the product easier to evaluate night after night.',
    lifestyle: [['Before bed', 'Fit the support while you can still check each strap.', 0], ['While settling in', 'Recheck pressure at the ankle and top of the foot.', 1], ['When you wake', 'Remove the splint and inspect the skin before standing.', 5], ['Packed for travel', 'The fabric design is lightweight and portable.', 4]],
    routineHeading: 'Support for day and night routines', related: relatedIds('ankle-support-side-stabilizers', 'electric-foot-hand-massager'),
    usage: 'Select the correct size, fit the fabric support around the foot and ankle, and adjust the tension strap gradually. Test the setup while awake before sleeping in it.',
    safety: 'Remove the splint immediately if it causes pain, numbness, tingling, swelling, irritation, color change, or restricted circulation. Use extra caution if sensation or circulation is reduced.', disclaimer,
    faq: [['Which sizes are available?', 'The current listing offers S, M, and L in black.'], ['Is it designed for sleeping?', 'Yes. The supplier listing describes it as a night splint sock for sleeping. Test the fit while awake before overnight use.'], ['Is it waterproof?', 'No. The supplier specification identifies the product as not waterproof.'], ['How tight should the front strap be?', 'Use only enough tension to hold a supported position. Loosen or remove it immediately if you feel pain, numbness, tingling, or restricted circulation.'], ['What material is listed?', 'The supplier description lists a fabric upper and outsole.']],
    compatibilityHeading: 'Available fit options', compatibility: [['Small', 'Black · size S.'], ['Medium', 'Black · size M.'], ['Large', 'Black · size L.']], cta: 'Choose Your Size', howImage: media(p, 0),
  }),
  'electric-foot-hand-massager': (p) => ({
    eyebrow: 'Rechargeable heat and massage wraps', headline: 'Bring Heat and Massage Into Your Wind-Down Routine.',
    subheadline: 'Choose from ankle, wrist, neck, airbag, and feature-specific wrap variants. Controls, heat levels, massage modes, battery details, and included parts vary by option.',
    identity: ['You want a portable relaxation routine.', 'You need to choose the body area before the feature set.', 'You prefer adjustable heat or massage controls where listed.'],
    painHeading: 'Does this feel familiar?', painIntro: 'With many variants, the most important first step is choosing the exact wrap and control set you intend to use.',
    pain: [['Variant names feel overwhelming', 'Each option identifies a body area and feature level.', 1], ['One setting does not suit every session', 'Several variants list multiple heat and vibration modes.', 2], ['Cords get in the way', 'Listed rechargeable variants are designed for portable use.', 5], ['You want a clear session boundary', 'Several models include an automatic timer; details vary by variant.', 4]],
    reassurance: 'Start by matching the body area and feature set—not by choosing on appearance alone.',
    videoHeading: 'See the pace of a simple relaxation routine.', videoText: 'This shared demonstration is temporary. Use the selected variant’s manual for exact controls, charging, and session limits.',
    outcomes: [['Multiple wrap styles', 'Ankle, wrist, neck, and airbag options.'], ['Rechargeable options', 'Type-C charging is listed for several models.'], ['Adjustable controls', 'Settings vary by selected variant.'], ['Timed sessions', 'Auto-off timing varies by model.']],
    howHeading: 'How it works', howIntro: 'Match the variant, charge it, then use the controls conservatively.',
    steps: [['Choose the exact variant', 'Read the full option name for body area, color, and feature level.', 1], ['Charge as directed', 'Use the included charging guidance and do not operate models that prohibit use while charging.', 5], ['Fit and select a setting', 'Secure the wrap, begin at a low setting, and follow the manual for the selected model.', 2]],
    usageTip: 'Because specifications vary across the 12 variants, keep the manual that arrives with your exact model.',
    lifestyleHeading: 'Make recovery time easier to repeat', lifestyleIntro: 'A portable wrap can fit into a quiet break after work, walking, or exercise.',
    lifestyle: [['After a long day', 'Choose a comfortable setting for a timed session.', 4], ['At a desk', 'Wrist variants support a seated relaxation routine.', 13], ['After movement', 'Ankle variants wrap around the joint area.', 7], ['Before you store it', 'Power off and allow the device to cool.', 5]],
    routineHeading: 'Pair relaxation with practical support', related: relatedIds('ankle-support-side-stabilizers', 'plantar-fasciitis-night-splint-sock'),
    usage: 'Confirm the exact variant, charge it according to the supplied manual, secure the wrap comfortably, and begin with the lowest comfortable setting. Controls and session timing vary by model.',
    safety: 'Do not use while charging if the selected model prohibits it. Stop immediately if heat feels excessive or you notice pain, numbness, irritation, dizziness, swelling, or skin color change. Keep powered components dry.', disclaimer,
    faq: [['Why are there so many options?', 'The listing combines ankle, wrist, neck, airbag, and feature-level variants. Read the entire option name before ordering.'], ['Do all variants vibrate?', 'No. Feature sets vary, and one option is explicitly labeled “Airbag NO Vibration.”'], ['Do all variants have the same heat levels?', 'No. The stored supplier description lists different heat levels and controls for different models. Follow the manual supplied with your selected variant.'], ['Can I use it while charging?', 'Some listed models specifically prohibit operation while charging. For safety, follow the manual for your exact variant.'], ['What comes in the box?', 'Included parts vary by variant. The stored descriptions commonly list the selected wrap, an instruction manual, and a Type-C cable, but confirm the selected option at checkout.']],
    compatibilityHeading: 'Choose by body area and features', compatibility: [['Ankle wraps', 'Multiple color and control configurations.'], ['Wrist wraps', 'Several heat and vibration level options.'], ['Neck wrap', 'A listed five-level gray model.'], ['Airbag options', 'With-vibration and no-vibration choices.'], ['Specialized option', 'A listed 660 nm red LED ankle variant.']], cta: 'Choose Your Wrap', howImage: media(p, 1),
  }),
};

const skipped = [];
const prepared = [];
for (const product of state.products.nodes) {
  const build = plans[product.handle];
  if (!build) { skipped.push({ handle: product.handle, reason: 'No reviewed content plan; original PDP left unchanged.' }); continue; }
  prepared.push({ product, plan: build(product) });
}

const backup = {
  generatedAt: new Date().toISOString(), apiVersion,
  products: state.products.nodes.map((product) => ({ id: product.id, handle: product.handle, templateSuffix: product.templateSuffix, metafields: product.metafields.nodes })),
  definitions: state.metafieldDefinitions.nodes,
  metaobjectDefinitions: state.metaobjectDefinitions.nodes,
};
await fs.mkdir('tmp/pdp-audit', { recursive: true });
await fs.writeFile('tmp/pdp-audit/pre-population-backup.json', JSON.stringify(backup, null, 2));

const report = {
  mode: apply ? 'apply' : 'dry-run', generatedAt: new Date().toISOString(), apiVersion,
  productsPrepared: prepared.map(({ product }) => product.handle), skipped,
  definitionsPlanned: 32, metaobjectDefinitionsPlanned: 3, deletesPlanned: 0,
};

if (!apply) {
  await fs.writeFile('tmp/pdp-audit/population-dry-run.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const metaobjectDefinitions = [
  { type: 'altaeron_pdp_card', name: 'Altaeron PDP card', displayNameKey: 'title', fieldDefinitions: [
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
    { key: 'text', name: 'Text', type: 'multi_line_text_field' },
    { key: 'image', name: 'Image', type: 'file_reference' },
    { key: 'icon', name: 'Icon key', type: 'single_line_text_field' },
    { key: 'url', name: 'URL', type: 'url' },
    { key: 'link_label', name: 'Link label', type: 'single_line_text_field' },
  ]},
  { type: 'altaeron_pdp_step', name: 'Altaeron PDP step', displayNameKey: 'title', fieldDefinitions: [
    { key: 'number', name: 'Step number', type: 'single_line_text_field' },
    { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
    { key: 'text', name: 'Instructions', type: 'multi_line_text_field' },
    { key: 'image', name: 'Image', type: 'file_reference' },
  ]},
  { type: 'altaeron_pdp_faq', name: 'Altaeron PDP FAQ', displayNameKey: 'question', fieldDefinitions: [
    { key: 'question', name: 'Question', type: 'single_line_text_field', required: true },
    { key: 'answer', name: 'Answer', type: 'multi_line_text_field', required: true },
  ]},
];

const definitionsByType = new Map(state.metaobjectDefinitions.nodes.map((definition) => [definition.type, definition]));
for (const definition of metaobjectDefinitions) {
  if (definitionsByType.has(definition.type)) continue;
  const result = await gql(`#graphql
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id type name } userErrors { field message code } }
    }
  `, { definition }, `Create ${definition.type}`);
  definitionsByType.set(definition.type, result.metaobjectDefinitionCreate.metaobjectDefinition);
}

const cardDefinitionId = definitionsByType.get('altaeron_pdp_card').id;
const stepDefinitionId = definitionsByType.get('altaeron_pdp_step').id;
const faqDefinitionId = definitionsByType.get('altaeron_pdp_faq').id;
const scalarDefinitions = [
  ['pdp_eyebrow', 'PDP eyebrow', 'single_line_text_field'], ['pdp_headline', 'PDP headline', 'multi_line_text_field'],
  ['pdp_subheadline', 'PDP supporting text', 'multi_line_text_field'], ['pdp_identity_points', 'PDP identity points', 'list.single_line_text_field'],
  ['pdp_pain_heading', 'PDP familiarity heading', 'single_line_text_field'], ['pdp_pain_intro', 'PDP familiarity intro', 'multi_line_text_field'],
  ['pdp_reassurance', 'PDP reassurance statement', 'multi_line_text_field'], ['pdp_video', 'PDP lifestyle video', 'file_reference'],
  ['pdp_video_heading', 'PDP video heading', 'single_line_text_field'], ['pdp_video_text', 'PDP video description', 'multi_line_text_field'],
  ['pdp_how_heading', 'PDP how-it-works heading', 'single_line_text_field'], ['pdp_how_intro', 'PDP how-it-works intro', 'multi_line_text_field'],
  ['pdp_how_image', 'PDP how-it-works image', 'file_reference'], ['pdp_usage_tip', 'PDP usage tip', 'multi_line_text_field'],
  ['pdp_lifestyle_heading', 'PDP lifestyle heading', 'single_line_text_field'], ['pdp_lifestyle_intro', 'PDP lifestyle intro', 'multi_line_text_field'],
  ['pdp_routine_heading', 'PDP routine heading', 'single_line_text_field'], ['pdp_related_products', 'PDP related products', 'list.product_reference'],
  ['pdp_usage_notes', 'PDP usage notes', 'multi_line_text_field'], ['pdp_safety_note', 'PDP safety note', 'multi_line_text_field'],
  ['pdp_disclaimer', 'PDP disclaimer', 'multi_line_text_field'], ['pdp_faq_heading', 'PDP FAQ heading', 'single_line_text_field'],
  ['pdp_compatibility_heading', 'PDP compatibility heading', 'single_line_text_field'], ['pdp_guides_heading', 'PDP guides heading', 'single_line_text_field'],
  ['pdp_cta_label', 'PDP add-to-cart label', 'single_line_text_field'],
];
const referenceDefinitions = [
  ['pdp_pain_cards', 'PDP familiarity cards', cardDefinitionId], ['pdp_outcome_cards', 'PDP outcome cards', cardDefinitionId],
  ['pdp_lifestyle_cards', 'PDP lifestyle cards', cardDefinitionId], ['pdp_compatibility_items', 'PDP compatibility items', cardDefinitionId],
  ['pdp_guide_cards', 'PDP guide cards', cardDefinitionId], ['pdp_how_steps', 'PDP how-it-works steps', stepDefinitionId],
  ['pdp_faq_items', 'PDP FAQs', faqDefinitionId],
];

const existingFields = new Set(state.metafieldDefinitions.nodes.map((definition) => `${definition.namespace}.${definition.key}`));
for (const [key, name, type] of scalarDefinitions) {
  if (existingFields.has(`altaeron.${key}`)) continue;
  await gql(`mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { createdDefinition { id namespace key } userErrors { field message code } } }`,
    { definition: { ownerType: 'PRODUCT', namespace: 'altaeron', key, name, description: 'Product-specific content for the reusable Altaeron PDP.', type, pin: false } }, `Create altaeron.${key}`);
}
for (const [key, name, definitionId] of referenceDefinitions) {
  if (existingFields.has(`altaeron.${key}`)) continue;
  await gql(`mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { createdDefinition { id namespace key } userErrors { field message code } } }`,
    { definition: { ownerType: 'PRODUCT', namespace: 'altaeron', key, name, description: 'Ordered structured content for the reusable Altaeron PDP.', type: 'list.metaobject_reference', pin: false, validations: [{ name: 'metaobject_definition_id', value: definitionId }] } }, `Create altaeron.${key}`);
}

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64);
async function upsertMetaobject(type, handle, fields) {
  const result = await gql(`#graphql
    mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) { metaobject { id handle type } userErrors { field message code } }
    }
  `, { handle: { type, handle }, metaobject: { fields: fields.filter((field) => field.value != null && field.value !== '') } }, `Upsert ${type}/${handle}`);
  return result.metaobjectUpsert.metaobject.id;
}

const updated = [];
for (const { product, plan } of prepared) {
  const makeCards = async (group, cards) => Promise.all(cards.map(async ([title, text, imageIndex], index) => upsertMetaobject('altaeron_pdp_card', slug(`${product.handle}-${group}-${index + 1}`), [
    { key: 'title', value: title }, { key: 'text', value: text }, { key: 'image', value: Number.isInteger(imageIndex) ? media(product, imageIndex) : null }, { key: 'icon', value: Number.isInteger(imageIndex) ? null : 'check' },
  ])));
  const painIds = await makeCards('familiar', plan.pain);
  const outcomeIds = await makeCards('outcome', plan.outcomes);
  const lifestyleIds = await makeCards('lifestyle', plan.lifestyle);
  const compatibilityIds = await makeCards('compatibility', plan.compatibility);
  const stepIds = await Promise.all(plan.steps.map(([title, text, imageIndex], index) => upsertMetaobject('altaeron_pdp_step', slug(`${product.handle}-step-${index + 1}`), [
    { key: 'number', value: String(index + 1) }, { key: 'title', value: title }, { key: 'text', value: text }, { key: 'image', value: media(product, imageIndex) },
  ])));
  const faqIds = await Promise.all(plan.faq.map(([question, answer], index) => upsertMetaobject('altaeron_pdp_faq', slug(`${product.handle}-faq-${index + 1}`), [
    { key: 'question', value: question }, { key: 'answer', value: answer },
  ])));

  const fields = [
    ['pdp_eyebrow', 'single_line_text_field', plan.eyebrow], ['pdp_headline', 'multi_line_text_field', plan.headline],
    ['pdp_subheadline', 'multi_line_text_field', plan.subheadline], ['pdp_identity_points', 'list.single_line_text_field', JSON.stringify(plan.identity)],
    ['pdp_pain_heading', 'single_line_text_field', plan.painHeading], ['pdp_pain_intro', 'multi_line_text_field', plan.painIntro],
    ['pdp_pain_cards', 'list.metaobject_reference', JSON.stringify(painIds)], ['pdp_reassurance', 'multi_line_text_field', plan.reassurance],
    ['pdp_video_heading', 'single_line_text_field', plan.videoHeading], ['pdp_video_text', 'multi_line_text_field', plan.videoText],
    ['pdp_outcome_cards', 'list.metaobject_reference', JSON.stringify(outcomeIds)], ['pdp_how_heading', 'single_line_text_field', plan.howHeading],
    ['pdp_how_intro', 'multi_line_text_field', plan.howIntro], ['pdp_how_steps', 'list.metaobject_reference', JSON.stringify(stepIds)],
    ['pdp_how_image', 'file_reference', plan.howImage], ['pdp_usage_tip', 'multi_line_text_field', plan.usageTip],
    ['pdp_lifestyle_heading', 'single_line_text_field', plan.lifestyleHeading], ['pdp_lifestyle_intro', 'multi_line_text_field', plan.lifestyleIntro],
    ['pdp_lifestyle_cards', 'list.metaobject_reference', JSON.stringify(lifestyleIds)], ['pdp_routine_heading', 'single_line_text_field', plan.routineHeading],
    ['pdp_related_products', 'list.product_reference', JSON.stringify(plan.related)], ['pdp_usage_notes', 'multi_line_text_field', plan.usage],
    ['pdp_safety_note', 'multi_line_text_field', plan.safety], ['pdp_disclaimer', 'multi_line_text_field', plan.disclaimer],
    ['pdp_faq_heading', 'single_line_text_field', 'You ask, we answer'], ['pdp_faq_items', 'list.metaobject_reference', JSON.stringify(faqIds)],
    ['pdp_compatibility_heading', 'single_line_text_field', plan.compatibilityHeading], ['pdp_compatibility_items', 'list.metaobject_reference', JSON.stringify(compatibilityIds)],
    ['pdp_cta_label', 'single_line_text_field', plan.cta],
  ].filter(([, , value]) => value != null && value !== '').map(([key, type, value]) => ({ ownerId: product.id, namespace: 'altaeron', key, type, value }));

  for (let index = 0; index < fields.length; index += 25) {
    await gql(`mutation SetPdpMetafields($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { id namespace key type } userErrors { field message code } } }`, { metafields: fields.slice(index, index + 25) }, `Populate ${product.handle} batch ${Math.floor(index / 25) + 1}`);
  }
  await gql(`mutation AssignPdpTemplate($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id handle templateSuffix } userErrors { field message } } }`, { product: { id: product.id, templateSuffix: 'altaeron' } }, `Assign PDP template to ${product.handle}`);
  updated.push({ handle: product.handle, metafields: fields.length, metaobjects: painIds.length + outcomeIds.length + lifestyleIds.length + compatibilityIds.length + stepIds.length + faqIds.length });
}

report.productsUpdated = updated;
report.metaobjectsUpserted = updated.reduce((sum, product) => sum + product.metaobjects, 0);
report.deletesPerformed = 0;
await fs.writeFile('tmp/pdp-audit/population-result.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
